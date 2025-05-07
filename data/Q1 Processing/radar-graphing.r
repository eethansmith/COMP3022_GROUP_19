set.seed(123)        # reproducible bootstrap

# Parameters
lambda       <- 5      # shrinkage pseudo-count
trim_frac    <- 0.1    # fraction trimmed for robust mean
boot_iter    <- 1000   # number of bootstrap replications
ci_level     <- 0.90   # confidence level for bootstrap CIs
ci_lower_prob <- (1 - ci_level) / 2
ci_upper_prob <- 1 - ci_lower_prob

# Read data
df <- read.csv("data/resources/mc1-report-data.csv", stringsAsFactors = FALSE)

# Normalise metrics to [0,1]
metrics10 <- c("sewer_and_water","power","roads_and_bridges","medical","buildings")
for (m in metrics10) {
  df[[m]] <- df[[m]] / 10
}
df$shake_intensity <- df$shake_intensity / 9

# Compute global prior means
all_metrics <- c(metrics10, "shake_intensity")
global_mean <- sapply(all_metrics, function(m) mean(df[[m]], na.rm = TRUE))

# 4) Function to compute shrinkage score and bootstrap CI
metric_stats <- function(x, prior_mean) {
  x <- x[!is.na(x)]
  n <- length(x)
  if (n == 0) {
    return(list(score = NA, n = 0,
                ci_low = NA, ci_high = NA))
  }
  # trimmed mean
  tmean <- mean(x, trim = trim_frac)
  # shrinkage toward prior
  score <- (n / (n + lambda)) * tmean + (lambda / (n + lambda)) * prior_mean
  # bootstrap CI if enough data
  if (n < 2) {
    ci <- c(NA, NA)
  } else {
    boots <- replicate(boot_iter, {
      samp <- sample(x, size = n, replace = TRUE)
      mean(samp, trim = trim_frac)
    })
    ci <- quantile(boots, probs = c(ci_lower_prob, ci_upper_prob), na.rm = TRUE)
  }
  list(score = score, n = n,
       ci_low = ci[1], ci_high = ci[2])
}

# Loop over areas and metrics
areas <- sort(unique(df$location))
out <- vector("list", length(areas))

for (i in seq_along(areas)) {
  a <- areas[i]
  sub <- df[df$location == a, , drop = FALSE]
  row <- list(location = a,
              total_reports = nrow(sub))
  for (m in all_metrics) {
    stats <- metric_stats(sub[[m]], prior_mean = global_mean[m])
    row[[paste0(m, "_score")]]  <- stats$score
    row[[paste0(m, "_n")]]      <- stats$n
    row[[paste0(m, "_ci_low")]] <- stats$ci_low
    row[[paste0(m, "_ci_high")]]<- stats$ci_high
  }
  out[[i]] <- row
}

# Build output data.frame and round
out_df <- do.call(rbind, lapply(out, function(x) as.data.frame(x, stringsAsFactors = FALSE)))
round_cols <- grep("(_score|_ci_low|_ci_high)$", names(out_df), value = TRUE)
out_df[round_cols] <- lapply(out_df[round_cols], round, digits = 3)

# Write to CSV
write.csv(out_df,
          "app/public/data/resources/radar-graphing.csv",
          row.names = FALSE)
