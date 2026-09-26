-- 0066: INS customer signing via share link
--
-- Staff create a row in ins_share_tokens (hash only; the raw token lives in the
-- link). The public page reads through ins_share_view() and signs through
-- ins_approve_by_token(). Both are SECURITY DEFINER and callable by anon, and
-- both validate the token themselves. Customer approval is only possible while
-- the inspection is TER_AKKOORD; staff still approve + lock afterwards.

create or replace function ins_share_view(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_tok ins_share_tokens;
  v_ins ins_inspections;
begin
  select * into v_tok from ins_share_tokens where token_hash = p_token_hash;
  if not found or v_tok.revoked_at is not null then
    raise exception 'INS_SHARE_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if v_tok.expires_at < now() then
    raise exception 'INS_SHARE_EXPIRED' using errcode = 'check_violation';
  end if;

  select * into v_ins from ins_inspections where id = v_tok.inspection_id and deleted_at is null;
  if not found then
    raise exception 'INS_SHARE_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  return jsonb_build_object(
    'id', v_ins.id,
    'reference', v_ins.reference,
    'status', v_ins.status,
    'purpose', v_ins.purpose,
    'licence_plate', v_ins.licence_plate,
    'make', v_ins.make,
    'model', v_ins.model,
    'odometer_km', v_ins.odometer_km,
    'event_date', v_ins.event_date,
    'event_description', v_ins.event_description,
    'total_hours', v_ins.total_hours,
    'finding_count', v_ins.finding_count,
    'submitted_at', v_ins.submitted_at,
    'locked_at', v_ins.locked_at,
    'customer', (select jsonb_build_object('name', c.name) from customers c where c.id = v_ins.customer_id),
    'inspector', (select jsonb_build_object('name', s.name) from staff s where s.id = v_ins.inspector_id),
    'findings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', f.id, 'reference', f.reference, 'component_key', f.component_key,
        'component_name', (select jsonb_build_object('nl', c.name_nl, 'en', c.name_en, 'tr', c.name_tr)
                           from ins_components c where c.key = f.component_key),
        'damage_types', f.damage_types, 'severity', f.severity, 'origin', f.origin,
        'disposition', f.disposition, 'repair_hours', f.repair_hours,
        'paint_required', f.paint_required, 'paint_hours', f.paint_hours,
        'description', f.description, 'hotspot_point', f.hotspot_point
      ) order by f.sequence_no), '[]'::jsonb)
      from ins_findings f where f.inspection_id = v_ins.id
    ),
    'photos', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id, 'reference', p.reference, 'kind', p.kind, 'finding_id', p.finding_id,
        'shot_key', p.shot_key, 'storage_path', p.storage_path, 'caption', p.caption
      ) order by p.sequence_no), '[]'::jsonb)
      from ins_photos p where p.inspection_id = v_ins.id
    ),
    'approvals', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'role', a.role, 'signer_name', a.signer_name, 'signed_at', a.signed_at
      ) order by a.signed_at), '[]'::jsonb)
      from ins_approvals a where a.inspection_id = v_ins.id
    ),
    'token', jsonb_build_object(
      'expires_at', v_tok.expires_at, 'used_at', v_tok.used_at, 'recipient_email', v_tok.recipient_email
    )
  );
end $$;

create or replace function ins_approve_by_token(
  p_token_hash     text,
  p_signer_name    text,
  p_signer_email   text,
  p_statement_text text,
  p_signature_path text,
  p_ip_address     inet default null,
  p_user_agent     text default null
) returns ins_approvals
language plpgsql security definer set search_path = public as $$
declare
  v_tok  ins_share_tokens;
  v_ins  ins_inspections;
  v_hash text;
  v_row  ins_approvals;
begin
  select * into v_tok from ins_share_tokens where token_hash = p_token_hash for update;
  if not found or v_tok.revoked_at is not null then
    raise exception 'INS_SHARE_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if v_tok.expires_at < now() then
    raise exception 'INS_SHARE_EXPIRED' using errcode = 'check_violation';
  end if;
  if v_tok.used_at is not null then
    raise exception 'INS_SHARE_USED' using errcode = 'unique_violation';
  end if;
  if coalesce(trim(p_signer_name), '') = '' then
    raise exception 'INS_APPROVAL: naam van ondertekenaar is vereist' using errcode = 'check_violation';
  end if;
  if coalesce(p_signature_path, '') = '' then
    raise exception 'INS_APPROVAL: handtekening is vereist' using errcode = 'check_violation';
  end if;

  select * into v_ins from ins_inspections where id = v_tok.inspection_id and deleted_at is null for update;
  if not found then
    raise exception 'INS_SHARE_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if v_ins.status <> 'TER_AKKOORD' then
    raise exception 'INS_SHARE_NOT_OPEN: status %', v_ins.status using errcode = 'check_violation';
  end if;
  if exists (select 1 from ins_approvals a where a.inspection_id = v_ins.id and a.role = 'klant') then
    raise exception 'INS_SHARE_USED' using errcode = 'unique_violation';
  end if;

  v_hash := encode(sha256(convert_to((ins_build_snapshot(v_ins.id) - 'approvals')::text, 'UTF8')), 'hex');

  insert into ins_approvals (
    inspection_id, role, signer_name, signer_user_id, signer_email,
    identification, statement_text, signature_path, document_hash, ip_address, user_agent
  ) values (
    v_ins.id, 'klant', trim(p_signer_name), null, p_signer_email,
    'share_link', coalesce(p_statement_text, ''), p_signature_path, v_hash, p_ip_address, p_user_agent
  ) returning * into v_row;

  update ins_share_tokens set used_at = now() where id = v_tok.id;

  insert into ins_events (inspection_id, event_type, actor_id, payload)
  values (v_ins.id, 'approval_klant', null,
          jsonb_build_object('approval_id', v_row.id, 'signer_name', v_row.signer_name,
                             'document_hash', v_hash, 'share_token_id', v_tok.id));

  return v_row;
end $$;

revoke all on function ins_share_view(text) from public;
revoke all on function ins_approve_by_token(text, text, text, text, text, inet, text) from public;
grant execute on function ins_share_view(text) to anon, authenticated;
grant execute on function ins_approve_by_token(text, text, text, text, text, inet, text) to anon, authenticated;
