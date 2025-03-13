# test push to data processing branch
df <- read.csv("data/resources/mc1-report-data.csv")
# Take column 'time' 
    # split YYYY-MM-DD hh:mm:ss into two columns (date and time)
df$date <- as.Date(df$timestamp_column)
df$time <- format(as.POSIXct(df$timestamp_column), format = "%H:%M:%S")

write.csv(df, "mc1-report-data-append.csv", row.names = FALSE)