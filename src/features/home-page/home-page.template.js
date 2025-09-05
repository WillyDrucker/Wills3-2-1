export function getHomePageTemplate() {
  return `
    <div class="card home-page-card">
      <div class="card-content-container">
        <h2 class="card-header"><span class="truncate-text">Training</span></h2>
        <div class="action-button-group">
          <button class="action-button button-primary" data-action="goToWorkout">Begin Today's Workout</button>
          <button class="action-button button-primary" data-action="goToStretching" disabled>Begin Today's Stretching</button>
          <button class="action-button button-primary" data-action="goToLegs" disabled>Begin Today's Conditioning</button>
        </div>
      </div>
    </div>
    <div class="card home-page-card">
      <div class="card-content-container">
        <h2 class="card-header"><span class="truncate-text">Navigation</span></h2>
        <div class="action-button-group">
          <button class="action-button button-primary" data-action="myPlans" disabled>My Plan</button>
        </div>
      </div>
    </div>
    <div class="card home-page-card">
      <div class="card-content-container">
        <h2 class="card-header"><span class="truncate-text">Workout History</span></h2>
        <div class="action-button-group">
          <button class="action-button button-primary" data-action="goToMyData">My Data</button>
        </div>
      </div>
    </div>
  `;
}
