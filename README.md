# MMM-WatchManSensit

MMM‑WatchManSensit is a [MagicMirror²](https://magicmirror.builders/) module that displays Kingspan SENSiT tank levels using the WatchMan Monitoring API. The module authenticates with the API, retrieves tank data including historical readings, and displays each tank’s current level as a vertical bar. It also calculates an estimated empty date based on a user‑definable look‑back period.

## Features

- **Authentication:** Logs in to the WatchMan Monitoring API using your credentials.
- **Data Retrieval:** Fetches current tank levels and historical readings.
- **Visual Display:** Shows a vertical bar for each tank, with colours based on thresholds (green, amber, red).
- **Consumption Analysis:** Uses historical data (default look‑back of 14 days) to estimate when the tank will reach 0%.
- **Customisable:** All key parameters (API endpoints, credentials, thresholds, look‑back period) can be set in your main `config.js`.

## Installation

1. **Clone or Download the Module:**
   - Clone the repository or download the files and place them in a folder called `MMM-WatchManSensit` within your `MagicMirror/modules` directory.

2. **Install Dependencies:**
   - Open a terminal in the `MMM-WatchManSensit` folder and run:
     ```
     npm install node-fetch
     ```
     This installs the required [node‑fetch](https://www.npmjs.com/package/node-fetch) package.

3. **Add the Module to MagicMirror:**
   - Edit your `config/config.js` file and add an entry for the module. For example:

     ```js
     {
         module: "MMM-WatchManSensit",
         position: "top_left", // Choose your desired location
         config: {
             updateInterval: 600000, // 10 minutes
             loginEndpoint: "https://api.watchmanmonitoring.com/api/v1/auth/login",
             tanksEndpoint: "https://api.watchmanmonitoring.com/api/v1/tanks",
             username: "your_email@example.com",
             password: "your_password",
             lookBackDays: 14, // Number of days to look back for consumption calculations
             thresholds: {
                 green: 40, // Bar turns green at 40% or above
                 amber: 20  // Bar turns amber at 20% or above (below 20% will be red)
             },
             colours: {
                 green: "green",
                 amber: "orange",
                 red: "red"
             }
         }
     }
     ```

## Configuration

The module uses the following configuration parameters:

- **updateInterval:** Frequency (in milliseconds) at which the module refreshes data.
- **loginEndpoint:** The URL used for authentication with the WatchMan Monitoring API.
- **tanksEndpoint:** The URL used to retrieve tank data.
- **username & password:** Your WatchMan Monitoring API credentials.
- **lookBackDays:** The number of days of historical data to use when calculating the estimated empty date (default is 14).
- **thresholds:** Percentage thresholds for bar colours:
  - *green:* Tank level at or above this percentage is green.
  - *amber:* Tank level at or above this percentage (but below green) is amber; below this will be red.
- **colours:** The display colours for each threshold.
- **animationSpeed:** Speed of the DOM update animation (in milliseconds).

## Usage

1. **Start MagicMirror:**
   - Launch your MagicMirror installation. The module will automatically authenticate with the WatchMan Monitoring API, retrieve tank data, and display the results.

2. **Viewing Data:**
   - Each tank will be shown with a vertical bar that represents its current level (in percentage).
   - The module will also display the current level percentage and an estimated date when the tank will reach 0%, calculated based on the consumption rate over the defined look‑back period.

## Troubleshooting

- **API Credentials:** Ensure that your username and password are correct.
- **Endpoints:** Verify that the endpoints match those documented on [WatchMan Monitoring API](https://api.watchmanmonitoring.com/#getting_started).
- **Dependencies:** Make sure you have installed `node-fetch` in the module folder.
- **Debugging:** Check the MagicMirror logs for any error messages from the MMM‑WatchManSensit node helper.

## License

This module is released under the MIT License.

## Credits

- Developed for use with MagicMirror².
- API integration based on the documentation provided at [WatchMan Monitoring API](https://api.watchmanmonitoring.com/#getting_started).


