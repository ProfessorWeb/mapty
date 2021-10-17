'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords; // [lat, lng]
  }

  description() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Running on April 14

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.calcPace();

    this.description();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.description();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/*-------Application Architecture------- */
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const workout__title = document.querySelector('.workouts');
const clearInput = document.querySelector('.clear-all');

class App {
  #mapZoomLevel = 13;
  #workout = [];
  #map;
  #mapEvent;
  constructor() {
    this._getPosition;
    this.getWorkout();

    // Create new Workout submit - When we Click Enter
    form.addEventListener('submit', this._newWorkout.bind(this));

    // Edit Workout
    // workout__title.addEventListener('dblclick', function (e) {
    //   if (e.target.classList.contains('workout__title')) {
    //     prompt();
    //   }
    // });

    // Clear All WorkOut list when we click on button Clear
    clearInput.addEventListener('click', this.clearWorkout);

    // Toggle - when we Select Running show me Cadence input when we Select Cycling show me Elev Gain
    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this.getPositon.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('We could not find your location.');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => this.renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // get data from form
    const type = inputType.value;
    const Distance = +inputDistance.value;
    const Duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    const vaild = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is vaild

      if (
        // We use ! and || beacuse if vaild it true i skip for allPositive and if it true also it work. remember if vaild it true is skip. if allPositive false it dont work also vaild.
        !vaild(Distance, Duration, cadence) ||
        !allPositive(Distance, Duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], Distance, Duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // Check if data is vaild
      if (
        !vaild(Distance, Duration, elevation) ||
        !allPositive(Distance, Duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], Distance, Duration, elevation);
    }

    // Add new object to workout array
    this.#workout.push(workout);
    // Render workout on map as marker
    this.renderWorkoutMarker(workout);
    this.renderList(workout);
    this._hideForm();

    this.saveWorkout();

    // Render workout on list

    // Hide form + clear input fields

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  renderWorkoutMarker(work) {
    L.marker(work.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${work.type}-popup`,
        })
      )
      .setPopupContent(`${work.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${work.type}`)
      .openPopup();
  }

  renderList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>

   
   `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>

      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>

    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
     </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  getPositon(e) {
    const workoutEL = e.target.closest('.workout');
    if (!workoutEL) return;
    const workout = this.#workout.find(
      workout => workout.id === workoutEL.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  saveWorkout() {
    localStorage.setItem('save-workout', JSON.stringify(this.#workout));
  }

  getWorkout() {
    const data = JSON.parse(localStorage.getItem('save-workout'));
    if (!data) return;
    this.#workout = data;

    this.#workout.forEach(work => this.renderList(work));

    // this.#workout.forEach(work => this.renderList(work));
  }

  editWorkout() {}

  clearWorkout() {
    localStorage.removeItem('save-workout');
    location.reload();
  }
}

const app = new App();

app._getPosition();
