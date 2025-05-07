library(dplyr)

# Load data
df <- read.csv("data/resources/mc1-report-data-processed.csv", stringsAsFactors = FALSE)

# Ensure datetime exists
df$datetime <- as.POSIXct(paste(df$date, df$timestamp), format = "%Y-%m-%d %H:%M:%S")

# Calculate raw metrics per location
df_q2 <- df %>%
  group_by(location) %>%
  summarise(
    report_count = n(),
    std_dev_buildings = sd(buildings, na.rm = TRUE),
    missing_shake_pct = sum(is.na(shake_intensity)) / n()
  )

# Normalize metrics to 0-1 scale
# Normalized report count is inverted → fewer reports = higher uncertainty
df_q2 <- df_q2 %>%
  mutate(
    normalized_report_count = 1 - (report_count - min(report_count)) / (max(report_count) - min(report_count)),
    normalized_std_dev = (std_dev_buildings - min(std_dev_buildings, na.rm = TRUE)) / (max(std_dev_buildings, na.rm = TRUE) - min(std_dev_buildings, na.rm = TRUE))
  )

# Replace any NaN from division by 0 with 0
df_q2[is.na(df_q2)] <- 0

# Compute final uncertainty score
df_q2 <- df_q2 %>%
  mutate(
    uncertainty_score = 0.3 * normalized_report_count +
                        0.5 * normalized_std_dev +
                        0.2 * missing_shake_pct,
    reliability_score = 1 - uncertainty_score,
    uncertainty_level = case_when(
      uncertainty_score <= 0.3 ~ "Low",
      uncertainty_score <= 0.6 ~ "Moderate",
      TRUE ~ "High"
    )
  )

# Save output
write.csv(df_q2, "data/resources/Q2/uncertainty-scores.csv", row.names = FALSE)
