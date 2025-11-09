/* ==========================================================================
   HOME PAGE - HTML Template

   Generates home page HTML with three card sections: Training, Navigation,
   and Results. Each section contains action buttons for navigation.

   Architecture: Three cards with home-group sections
   - Training: Workout, Stretching (disabled), Conditioning (disabled)
   - Navigation: My Plan
   - Results: My Data, Performance (disabled)

   Dependencies: None (pure template)
   Used by: home-page.index.js (renderHomePage)
   ========================================================================== */

/* === TEMPLATE GENERATION === */

export function getHomePageTemplate() {
  return `
    <div class="card home-page-card">
      <div class="card-content-container">
        <div class="home-group">
          <h2 class="card-header">Training</h2>
          <div class="action-button-group">
            <button class="action-button button-log" data-action="goToWorkout">Begin Today's Workout</button>
            <button class="action-button button-log" data-action="goToStretching" disabled>Begin Today's Stretching</button>
            <button class="action-button button-log" data-action="goToLegs" disabled>Begin Today's Conditioning</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card home-page-card">
      <div class="card-content-container">
        <div class="home-group">
          <h2 class="card-header">Training Programs</h2>
          <div class="action-button-group">
            <button class="action-button button-cyan" data-action="goToMyPlan">My Plan</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card home-page-card">
      <div class="card-content-container">
        <div class="home-group">
          <h2 class="card-header">Results</h2>
          <div class="action-button-group">
            <button class="action-button button-primary" data-action="goToMyData">My Data</button>
            <button class="action-button button-primary" disabled>Performance</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
