def to_minutes(time_str: str) -> int:
   h, m = map(int, time_str.split(":"))
   return h * 60 + m


def is_time_in_ranges(ranges, time_str: str) -> bool:
   if not ranges:
       return False

   target = to_minutes(time_str)

   for start, end in ranges:
       start_m = to_minutes(start)
       end_m = to_minutes(end)

       if start_m <= end_m:
           if start_m <= target <= end_m:
               return True
       else:
           # overnight case
           if target >= start_m or target <= end_m:
               return True

   return False


def is_open(hours_dict, day: str, time_str: str) -> bool:
   if not hours_dict or day not in hours_dict:
       return False
   return is_time_in_ranges(hours_dict[day], time_str)