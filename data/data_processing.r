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
