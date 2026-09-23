-- Add Saturday opening hours (day_of_week=5, 0=Monday scheme)
-- Saturday: 09:00 – 13:00
insert into opening_hours (day_of_week, open_time, close_time) values
  (5, '09:00', '13:00');

-- Fix weekday close times: 17:00 → 17:30
update opening_hours set close_time = '17:30' where day_of_week between 0 and 4;
