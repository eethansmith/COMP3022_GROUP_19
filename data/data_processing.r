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

# Create datetime object from date and timestamp
df$datetime <- as.POSIXct(paste(df$date, df$timestamp), format = "%Y-%m-%d %H:%M:%S")

# Round down datetime to the hour
df$rounded_hour <- format(df$datetime, "%Y-%m-%d %H:00:00")

# Group by location and rounded hour, calculate rounded integer averages
df_hourly <- df %>%
  group_by(location, rounded_hour) %>%
  summarise(
    date = as.Date(first(date)),
    timestamp = format(as.POSIXct(first(rounded_hour)), "%H:%M:%S"),
    sewer_and_water = round(mean(sewer_and_water, na.rm = TRUE)),
    power = round(mean(power, na.rm = TRUE)),
    roads_and_bridges = round(mean(roads_and_bridges, na.rm = TRUE)),
    medical = round(mean(medical, na.rm = TRUE)),
    buildings = round(mean(buildings, na.rm = TRUE)),
    shake_intensity = round(mean(shake_intensity, na.rm = TRUE))
  ) %>%
  ungroup() %>%
  select(date, timestamp, location, everything(), -rounded_hour)

# Save hourly rounded dataset to new CSV
write.csv(df_hourly, "data/resources/mc1-report-data-hourly-rounded.csv", row.names = FALSE)
