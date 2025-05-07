# Load CSV
df <- read.csv("data/resources/uncertainty-scores.csv")

# Assign numeric range for data quality
# 0 = Low quality, 1 = Moderate, 2 = High
df$data_quality_range <- ifelse(
  df$missing_shake_pct > 0.5 | df$report_count < 200, 
  0,
  ifelse(
    (df$missing_shake_pct > 0.1 & df$missing_shake_pct <= 0.5) | (df$report_count > 100 & df$report_count < 200), 
    1,
    2
  )
)

# Write new CSV
write.csv(df, "uncertainty-scores-with-range.csv", row.names = FALSE)