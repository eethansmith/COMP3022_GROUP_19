library(dplyr)

# Read in the original dataset 
df <- read.csv("data/resources/mc1-report-data.csv")
# Take column 'time' 
    # split YYYY-MM-DD hh:mm:ss into two columns (date and time)
df$date <- as.Date(df$time)
df$timestamp <- format(as.POSIXct(df$time), "%H:%M:%S")

# Remove 'time' column with original formating
df$time <- NULL

df <- df %>%
  select(date, timestamp, everything())

# Save data to new csv with changed column
write.csv(df, "data/resources/mc1-report-data-processed.csv", row.names = FALSE)