"use client";

import React from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField } from "@mui/material";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function DateTimeInput({
  id,
  valueMs,
  onChangeMs,
  required,
  className,
}: {
  id: string;
  valueMs?: number;
  onChangeMs: (ms: number) => void;
  required?: boolean;
  className?: string;
}) {
  const handleChange = (newValue: dayjs.Dayjs | null) => {
    if (newValue) {
      // Convert to Pacific timezone and get epoch milliseconds
      const pacificTime = newValue.tz("America/Los_Angeles");
      onChangeMs(pacificTime.valueOf());
    } else {
      onChangeMs(0);
    }
  };

  const value = valueMs ? dayjs(valueMs).tz("America/Los_Angeles") : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        value={value}
        onChange={handleChange}
        timezone="America/Los_Angeles"
        slotProps={{
          textField: {
            id,
            required,
            className,
            size: "small",
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  );
}
