
infile  <- "data/resources/mc1-report-data.csv"       
outfile <- "app/public/data/resources/Q3/location-time-matrix.csv"   

raw <- read.csv(infile, stringsAsFactors = FALSE)

# Convert the character time stamp to POSIXct (UTC)
raw$time <- as.POSIXct(raw$time,
                       format = "%Y-%m-%d %H:%M:%S",
                       tz     = "UTC")

# “Floor” every time stamp to the start of its hour to get the bin
time_lt        <- as.POSIXlt(raw$time, tz = "UTC")
time_lt$min    <- 0L     # zero-out minutes
time_lt$sec    <- 0L     # zero-out seconds
raw$time_bin_pt <- as.POSIXct(time_lt, tz = "UTC")   # POSIXct form

# ISO-8601 character version (e.g. “2020-04-05T23:00:00Z”)
raw$time_bin <- format(raw$time_bin_pt, "%Y-%m-%dT%H:%M:%SZ")

all_bins_pt  <- seq(from = min(raw$time_bin_pt, na.rm = TRUE),
                    to   = max(raw$time_bin_pt, na.rm = TRUE),
                    by   = "hour")
all_bins_chr <- format(all_bins_pt, "%Y-%m-%dT%H:%M:%SZ")   # same, char

locations <- sort(unique(raw$location))                     # 0 – 19

# Prepare an empty data.frame for the results
result <- data.frame(stringsAsFactors = FALSE)

for (loc in locations) {
  for (i in seq_along(all_bins_pt)) {

    # Current location / bin definition
    bin_start_pt  <- all_bins_pt[i]   # POSIXct (handy for comparisons)
    bin_start_chr <- all_bins_chr[i]  # human-/file-friendly form

    # Subset of raw reports that fall into *this* location & hour
    sub <- raw[ raw$location      == loc &
                raw$time_bin_pt   == bin_start_pt , ]

    n_reports <- nrow(sub)                # how many reports in the bin?

    # If there *are* reports, compute the metrics; otherwise NA/1 etc.
    if (n_reports > 0) {

      # ~~~~~ Composite severity ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      # Row-level mean over the 5 infrastructure dimensions (0-10 each)
      sev_per_row <- rowMeans(
        sub[, c("sewer_and_water",
                "power",
                "roads_and_bridges",
                "medical",
                "buildings")],
        na.rm = TRUE
      )

      # If every value was NA we’ll get NaN – convert to NA
      if (all(is.na(sev_per_row))) {
        composite_severity <- NA_real_
      } else {
        composite_severity <- mean(sev_per_row, na.rm = TRUE)
      }

      # Missing shake_intensity statistics
      miss_cells   <- sum(is.na(sub$shake_intensity))
      missing_rate <- miss_cells / n_reports     # proportion 0-1

      # Local uncertainty (simple heuristic) 
      size_component      <- 1 / n_reports                     # 1, 0.5, …
      variation_component <- sd(sev_per_row, na.rm = TRUE) / 10  # 0-1
      local_uncertainty   <- min(1, size_component + variation_component)

    } else {
      # No reports at all – define sensible “empty-bin” defaults
      composite_severity <- NA_real_
      miss_cells         <- 0L
      missing_rate       <- NA_real_
      local_uncertainty  <- 1       # maximal uncertainty
    }

    # Collect the metrics for this (location, hour) into one row
    row_out <- data.frame(
      location           = loc,
      time_bin           = bin_start_chr,
      n_reports          = n_reports,
      composite_severity = composite_severity,
      miss_cells         = miss_cells,
      missing_rate       = missing_rate,
      local_uncertainty  = local_uncertainty,
      stringsAsFactors   = FALSE
    )

    # Append to the result table
    result <- rbind(result, row_out)
  }
}
write.csv(result, file = outfile, row.names = FALSE)
