# Load required library
library(dplyr)

# Read in original dataset
df <- read.csv("data/resources/mc1-report-data.csv", stringsAsFactors = FALSE)

# Convert 'time' column into proper date and timestamp
df$date <- as.Date(df$time, format = "%Y-%m-%d %H:%M:%S")
df$timestamp <- format(as.POSIXct(df$time, format = "%Y-%m-%d %H:%M:%S"), "%H:%M:%S")

# Remove original 'time' column
df$time <- NULL

# Explicitly reorder columns as desired
df <- df %>%
  select(
    date,
    timestamp,
    location,
    sewer_and_water,
    power,
    roads_and_bridges,
    medical,
    buildings,
    shake_intensity,
  )

# Sort dataset by location, then date, then timestamp
df <- df %>%
  arrange(location, date, timestamp)

# Save the processed and sorted data to CSV
write.csv(df, "data/resources/mc1-report-data-processed.csv", row.names = FALSE)

# Make sure df$datetime exists and is valid
df$datetime <- as.POSIXct(paste(df$date, df$timestamp), format = "%Y-%m-%d %H:%M:%S")

# Filter out rows with NA datetime
df <- df[!is.na(df$datetime), ]

# Create full sequence of hourly times in the dataset
min_time <- min(df$datetime, na.rm = TRUE)
max_time <- max(df$datetime, na.rm = TRUE)
all_hours <- seq(from = as.POSIXct(format(min_time, "%Y-%m-%d %H:00:00")),
                 to = as.POSIXct(format(max_time, "%Y-%m-%d %H:00:00")),
                 by = "hour")

# Get all unique locations
all_locations <- unique(df$location)

# Create full grid of all hour-location combinations
full_grid <- expand.grid(
  location = all_locations,
  rounded_hour = format(all_hours, "%Y-%m-%d %H:00:00"),
  stringsAsFactors = FALSE
)

# Merge with the summarised df_hourly data
df_hourly_full <- merge(
  full_grid,
  df_hourly %>%
    mutate(rounded_hour = paste(date, timestamp)) %>%
    select(-date, -timestamp),
  by = c("location", "rounded_hour"),
  all.x = TRUE
)

# Recreate proper date and timestamp columns
df_hourly_full$date <- as.Date(df_hourly_full$rounded_hour)
df_hourly_full$timestamp <- format(as.POSIXct(df_hourly_full$rounded_hour), "%H:%M:%S")

# Reorder columns
df_hourly_full <- df_hourly_full %>%
  select(date, timestamp, location, sewer_and_water, power, roads_and_bridges,
         medical, buildings, shake_intensity)

# Save final CSV with all hours filled
write.csv(df_hourly_full, "data/resources/mc1-report-data-hourly-rounded.csv", row.names = FALSE)
