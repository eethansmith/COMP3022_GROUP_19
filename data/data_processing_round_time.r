data <- read.csv("data/resources/mc1-report-data-processed.csv", stringsAsFactors = FALSE)

# Combine date and time into a full datetime
data$datetime <- strptime(paste(data$date, data$timestamp), format = "%Y-%m-%d %H:%M:%S")

# Round down to the hour
data$hour <- format(data$datetime, "%Y-%m-%d %H:00:00")

# Now aggregate
aggregated <- aggregate(
  . ~ hour + location, 
  data = data[, c("hour", "location", "sewer_and_water", "power", "roads_and_bridges", 
                  "medical", "buildings", "shake_intensity")],
  FUN = function(x) mean(x, na.rm = TRUE)
)

# View result
print(aggregated)