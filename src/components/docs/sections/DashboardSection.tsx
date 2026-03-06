export function DashboardSection() {
  return (
    <section id="dashboard">
      <h2>Dashboard</h2>
      <p>
        The dashboard is the first page you see when you enter a workspace. It gives you a
        high-level overview of the health, structure, and recent activity of your platform.
      </p>

      <h3 id="dashboard-stat-cards">Stat cards</h3>
      <p>
        Four metric cards at the top of the dashboard summarize the current state of your
        workspace at a glance:
      </p>
      <table>
        <thead>
          <tr>
            <th>Card</th>
            <th>What it shows</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Domains</strong>
            </td>
            <td>Total number of business domains registered in the workspace</td>
          </tr>
          <tr>
            <td>
              <strong>Systems</strong>
            </td>
            <td>Total number of systems (services, workers, jobs, etc.) in the workspace</td>
          </tr>
          <tr>
            <td>
              <strong>Dependencies</strong>
            </td>
            <td>Total number of resolved dependency edges between systems</td>
          </tr>
          <tr>
            <td>
              <strong>HIGH + CRITICAL Risks</strong>
            </td>
            <td>Count of risk entries with severity HIGH or CRITICAL across all systems</td>
          </tr>
        </tbody>
      </table>

      <h3 id="dashboard-charts">Charts</h3>
      <p>Two horizontal bar charts show the distribution of your platform at a glance:</p>
      <ul>
        <li>
          <strong>Languages distribution</strong> — number of systems per programming language.
          Helps identify the predominant tech stack and outliers.
        </li>
        <li>
          <strong>Dependency types</strong> — count of resolved edges per dependency type (HTTP,
          Kafka, shared database, etc.). Shows which integration patterns are most common.
        </li>
      </ul>

      <h3 id="dashboard-top-systems">Top connected systems</h3>
      <p>
        A ranked table listing the systems with the most dependency connections (inbound +
        outbound combined). These high-coupling systems are often the most critical nodes in your
        architecture and deserve special attention when planning changes.
      </p>
      <p>
        Click any system name to navigate directly to its detail page.
      </p>

      <h3 id="dashboard-risks">Risks & recent uploads</h3>
      <p>
        Two additional tables give you visibility into recent activity:
      </p>
      <ul>
        <li>
          <strong>Recent risks</strong> — the latest 5 risk entries with HIGH or CRITICAL
          severity. Each row shows the risk title, the system it belongs to, and a color-coded
          severity badge.
        </li>
        <li>
          <strong>Recent uploads</strong> — the last 5 inventory upload attempts, showing the
          filename, processing status (<code>PENDING</code>, <code>PROCESSING</code>,{" "}
          <code>COMPLETED</code>, <code>FAILED</code>), the number of systems affected, and the
          upload timestamp.
        </li>
      </ul>
    </section>
  );
}
