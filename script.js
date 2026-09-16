// ============================================================
// WEATHERLY - WEATHER DASHBOARD
// Open-Meteo API
// ============================================================


// ============================================================
// DOM ELEMENTS
// ============================================================

const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const locationButton = document.getElementById("locationButton");

const loading = document.getElementById("loading");
const weatherContent = document.getElementById("weatherContent");

const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

const themeToggle = document.getElementById("themeToggle");
const unitToggle = document.getElementById("unitToggle");


// ============================================================
// APP STATE
// ============================================================

let selectedUnit = "C";

let currentWeatherData = null;


// ============================================================
// WEATHER CODES
// ============================================================

const weatherCodes = {

    0: {
        text: "Clear Sky",
        icon: "☀️"
    },

    1: {
        text: "Mainly Clear",
        icon: "🌤️"
    },

    2: {
        text: "Partly Cloudy",
        icon: "⛅"
    },

    3: {
        text: "Overcast",
        icon: "☁️"
    },

    45: {
        text: "Fog",
        icon: "🌫️"
    },

    48: {
        text: "Depositing Rime Fog",
        icon: "🌫️"
    },

    51: {
        text: "Light Drizzle",
        icon: "🌦️"
    },

    53: {
        text: "Drizzle",
        icon: "🌦️"
    },

    55: {
        text: "Heavy Drizzle",
        icon: "🌧️"
    },

    56: {
        text: "Freezing Drizzle",
        icon: "🌧️"
    },

    57: {
        text: "Heavy Freezing Drizzle",
        icon: "🌧️"
    },

    61: {
        text: "Light Rain",
        icon: "🌦️"
    },

    63: {
        text: "Rain",
        icon: "🌧️"
    },

    65: {
        text: "Heavy Rain",
        icon: "🌧️"
    },

    66: {
        text: "Freezing Rain",
        icon: "🌧️"
    },

    67: {
        text: "Heavy Freezing Rain",
        icon: "🌧️"
    },

    71: {
        text: "Light Snow",
        icon: "🌨️"
    },

    73: {
        text: "Snow",
        icon: "🌨️"
    },

    75: {
        text: "Heavy Snow",
        icon: "❄️"
    },

    77: {
        text: "Snow Grains",
        icon: "❄️"
    },

    80: {
        text: "Light Rain Showers",
        icon: "🌦️"
    },

    81: {
        text: "Rain Showers",
        icon: "🌧️"
    },

    82: {
        text: "Heavy Rain Showers",
        icon: "⛈️"
    },

    85: {
        text: "Light Snow Showers",
        icon: "🌨️"
    },

    86: {
        text: "Heavy Snow Showers",
        icon: "❄️"
    },

    95: {
        text: "Thunderstorm",
        icon: "⛈️"
    },

    96: {
        text: "Thunderstorm with Hail",
        icon: "⛈️"
    },

    99: {
        text: "Heavy Thunderstorm with Hail",
        icon: "⛈️"
    }

};


// ============================================================
// GET WEATHER INFORMATION FROM CODE
// ============================================================

function getWeatherInfo(code) {

    return weatherCodes[code] || {
        text: "Unknown Conditions",
        icon: "🌤️"
    };

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(dateString) {

    if (!dateString) {
        return "--";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateString) {

    if (!dateString) {
        return "--";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric"
    });

}


// ============================================================
// LOADING STATE
// ============================================================

function showLoading() {

    loading.style.display = "flex";

    weatherContent.style.display = "none";

    errorMessage.style.display = "none";

}


// ============================================================
// HIDE LOADING
// ============================================================

function hideLoading() {

    loading.style.display = "none";

    weatherContent.style.display = "block";

}


// ============================================================
// SHOW ERROR
// ============================================================

function showError(message) {

    loading.style.display = "none";

    weatherContent.style.display = "none";

    errorMessage.style.display = "flex";

    errorText.textContent = message;

}


// ============================================================
// HIDE ERROR
// ============================================================

function hideError() {

    errorMessage.style.display = "none";

}


// ============================================================
// TEMPERATURE CONVERSION
// ============================================================

function convertTemperature(celsius) {

    if (
        typeof celsius !== "number" ||
        Number.isNaN(celsius)
    ) {
        return "--";
    }


    if (selectedUnit === "F") {

        return Math.round(
            (celsius * 9 / 5) + 32
        );

    }


    return Math.round(celsius);

}


// ============================================================
// SEARCH FOR CITY
// ============================================================

async function searchCity(city) {

    const searchTerm = city.trim();


    if (!searchTerm) {

        showError(
            "Please enter a city name."
        );

        return;

    }


    showLoading();


    try {

        const url =
            "https://geocoding-api.open-meteo.com/v1/search?" +
            new URLSearchParams({
                name: searchTerm,
                count: "1",
                language: "en",
                format: "json"
            });


        const response = await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Geocoding request failed: ${response.status}`
            );

        }


        const data = await response.json();


        if (
            !data.results ||
            data.results.length === 0
        ) {

            showError(
                `No location found for "${searchTerm}".`
            );

            return;

        }


        const location = data.results[0];


        await getWeather(
            location.latitude,
            location.longitude,
            location.name,
            location.country || ""
        );


    } catch (error) {

        console.error(
            "City search error:",
            error
        );


        showError(
            "Unable to find that city. Please try again."
        );

    }

}


// ============================================================
// GET WEATHER
// ============================================================

async function getWeather(
    latitude,
    longitude,
    city,
    country
) {

    showLoading();


    try {

        /*
         * IMPORTANT:
         * Open-Meteo requires the parameters below
         * to be written exactly as supported by its API.
         */


        const params = new URLSearchParams({

            latitude: latitude,

            longitude: longitude,

            current:
                "temperature_2m," +
                "relative_humidity_2m," +
                "apparent_temperature," +
                "weather_code," +
                "wind_speed_10m," +
                "visibility",

            hourly:
                "temperature_2m," +
                "weather_code," +
                "precipitation_probability",

            daily:
                "weather_code," +
                "temperature_2m_max," +
                "temperature_2m_min," +
                "sunrise," +
                "sunset," +
                "uv_index_max",

            timezone: "auto",

            forecast_days: "7"

        });


        const url =
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`;


        console.log(
            "Weather API:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            const errorBody =
                await response.text();


            console.error(
                "Open-Meteo error:",
                errorBody
            );


            throw new Error(
                `Weather API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.current ||
            !data.hourly ||
            !data.daily
        ) {

            throw new Error(
                "Incomplete weather data received."
            );

        }


        currentWeatherData = {

            data: data,

            city: city,

            country: country

        };


        renderWeather();


    } catch (error) {

        console.error(
            "Weather request failed:",
            error
        );


        showError(
            "Unable to load weather data. Please check your internet connection and try again."
        );

    }

}


// ============================================================
// RENDER EVERYTHING
// ============================================================

function renderWeather() {

    if (!currentWeatherData) {
        return;
    }


    const {
        data,
        city,
        country
    } = currentWeatherData;


    const current =
        data.current;


    const weather =
        getWeatherInfo(
            current.weather_code
        );


    // LOCATION

    document.getElementById(
        "cityName"
    ).textContent = city;


    document.getElementById(
        "countryName"
    ).textContent = country;


    // DATE

    document.getElementById(
        "currentDate"
    ).textContent =
        formatDate(current.time);


    document.getElementById(
        "currentTime"
    ).textContent =
        formatTime(current.time);


    // WEATHER ICON

    document.getElementById(
        "currentIcon"
    ).textContent =
        weather.icon;


    // TEMPERATURE

    document.getElementById(
        "currentTemp"
    ).textContent =
        convertTemperature(
            Number(current.temperature_2m)
        );


    // DESCRIPTION

    document.getElementById(
        "weatherDescription"
    ).textContent =
        weather.text;


    // FEELS LIKE

    document.getElementById(
        "feelsLike"
    ).textContent =
        `${convertTemperature(
            Number(current.apparent_temperature)
        )}°`;


    // HUMIDITY

    document.getElementById(
        "humidity"
    ).textContent =
        `${current.relative_humidity_2m}%`;


    // WIND

    document.getElementById(
        "wind"
    ).textContent =
        `${Math.round(
            Number(current.wind_speed_10m)
        )} km/h`;


    // VISIBILITY

    document.getElementById(
        "visibility"
    ).textContent =
        `${Math.round(
            Number(current.visibility) / 1000
        )} km`;


    // UV

    document.getElementById(
        "uvIndex"
    ).textContent =
        Math.round(
            Number(
                data.daily.uv_index_max[0]
            )
        );


    renderHourly(data);

    renderDaily(data);

    renderSun(data);


    hideError();

    hideLoading();

}


// ============================================================
// HOURLY FORECAST
// ============================================================

function renderHourly(data) {

    const container =
        document.getElementById(
            "hourlyForecast"
        );


    container.innerHTML = "";


    const now =
        new Date();


    let startIndex =
        data.hourly.time.findIndex(
            time =>
                new Date(time) >= now
        );


    if (startIndex === -1) {

        startIndex = 0;

    }


    const numberOfHours = 8;


    for (
        let i = startIndex;
        i < startIndex + numberOfHours &&
        i < data.hourly.time.length;
        i++
    ) {

        const date =
            new Date(
                data.hourly.time[i]
            );


        const weather =
            getWeatherInfo(
                data.hourly.weather_code[i]
            );


        const temperature =
            convertTemperature(
                Number(
                    data.hourly.temperature_2m[i]
                )
            );


        const precipitation =
            data.hourly
                .precipitation_probability[i];


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "hour-card";


        if (i === startIndex) {

            card.classList.add(
                "active"
            );

        }


        card.innerHTML = `

            <span>
                ${
                    i === startIndex
                        ? "Now"
                        : date.toLocaleTimeString(
                            [],
                            {
                                hour: "numeric"
                            }
                        )
                }
            </span>

            <div class="hour-icon">
                ${weather.icon}
            </div>

            <div class="hour-temp">
                ${temperature}°
            </div>

            <small style="
                display:block;
                margin-top:8px;
                font-size:9px;
                opacity:.65;
            ">
                ${precipitation ?? 0}% rain
            </small>

        `;


        container.appendChild(
            card
        );

    }

}


// ============================================================
// DAILY FORECAST
// ============================================================

function renderDaily(data) {

    const container =
        document.getElementById(
            "dailyForecast"
        );


    container.innerHTML = "";


    const days =
        Math.min(
            7,
            data.daily.time.length
        );


    for (
        let i = 0;
        i < days;
        i++
    ) {

        const date =
            new Date(
                data.daily.time[i]
            );


        const weather =
            getWeatherInfo(
                data.daily.weather_code[i]
            );


        const max =
            convertTemperature(
                Number(
                    data.daily.temperature_2m_max[i]
                )
            );


        const min =
            convertTemperature(
                Number(
                    data.daily.temperature_2m_min[i]
                )
            );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "day-row";


        row.innerHTML = `

            <div>

                <div class="day-name">

                    ${
                        i === 0
                            ? "Today"
                            : date.toLocaleDateString(
                                [],
                                {
                                    weekday: "short"
                                }
                            )
                    }

                </div>

                <div class="day-date">

                    ${
                        date.toLocaleDateString(
                            [],
                            {
                                month: "short",
                                day: "numeric"
                            }
                        )
                    }

                </div>

            </div>


            <div class="day-icon">

                ${weather.icon}

            </div>


            <div class="day-condition">

                ${weather.text}

            </div>


            <div class="day-temp">

                ${max}° / ${min}°

            </div>

        `;


        container.appendChild(
            row
        );

    }

}


// ============================================================
// SUNRISE / SUNSET
// ============================================================

function renderSun(data) {

    document.getElementById(
        "sunrise"
    ).textContent =
        formatTime(
            data.daily.sunrise[0]
        );


    document.getElementById(
        "sunset"
    ).textContent =
        formatTime(
            data.daily.sunset[0]
        );

}


// ============================================================
// SEARCH
// ============================================================

searchButton.addEventListener(
    "click",
    () => {

        searchCity(
            cityInput.value
        );

    }
);


cityInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            searchCity(
                cityInput.value
            );

        }

    }
);


// ============================================================
// CURRENT LOCATION
// ============================================================

locationButton.addEventListener(
    "click",
    () => {

        if (
            !navigator.geolocation
        ) {

            showError(
                "Your browser does not support location services."
            );

            return;

        }


        showLoading();


        navigator.geolocation.getCurrentPosition(

            async position => {

                const latitude =
                    position.coords.latitude;


                const longitude =
                    position.coords.longitude;


                await getWeather(
                    latitude,
                    longitude,
                    "Your Location",
                    ""
                );

            },


            error => {

                console.error(
                    "Location error:",
                    error
                );


                showError(
                    "Location permission was denied. Search for a city instead."
                );

            },

            {
                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 300000
            }

        );

    }
);


// ============================================================
// CELSIUS / FAHRENHEIT
// ============================================================

unitToggle.addEventListener(
    "click",
    () => {

        selectedUnit =
            selectedUnit === "C"
                ? "F"
                : "C";


        const units =
            unitToggle.querySelectorAll(
                "span"
            );


        units.forEach(
            unit => {

                unit.classList.remove(
                    "active"
                );

            }
        );


        if (selectedUnit === "C") {

            units[0].classList.add(
                "active"
            );

        } else {

            units[1].classList.add(
                "active"
            );

        }


        if (currentWeatherData) {

            renderWeather();

        }

    }
);


// ============================================================
// DARK MODE
// ============================================================

themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );


        const icon =
            themeToggle.querySelector(
                "i"
            );


        if (
            document.body.classList.contains(
                "dark"
            )
        ) {

            icon.className =
                "fa-solid fa-sun";

            localStorage.setItem(
                "weatherly-theme",
                "dark"
            );

        } else {

            icon.className =
                "fa-solid fa-moon";

            localStorage.setItem(
                "weatherly-theme",
                "light"
            );

        }

    }
);


// ============================================================
// RESTORE THEME
// ============================================================

const savedTheme =
    localStorage.getItem(
        "weatherly-theme"
    );


if (savedTheme === "dark") {

    document.body.classList.add(
        "dark"
    );


    const icon =
        themeToggle.querySelector(
            "i"
        );


    icon.className =
        "fa-solid fa-sun";

}


// ============================================================
// INITIAL WEATHER
// ============================================================

// Lagos coordinates

getWeather(
    6.5244,
    3.3792,
    "Lagos",
    "Nigeria"
);
