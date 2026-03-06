export function SystemsSection() {
  return (
    <section id="systems">
      <h2>Systems</h2>
      <p>
        The Systems section lets you browse all services, workers, and jobs registered in your
        workspace. It provides two views: a searchable list of all systems and a detailed page
        for each individual system.
      </p>

      <h3 id="systems-list">Systems list</h3>
      <p>
        Navigate to <strong>Systems</strong> in the workspace header. The page shows a table with
        all systems in the workspace, sorted alphabetically. Each row displays:
      </p>
      <ul>
        <li>
          <strong>System name</strong> — links to the system detail page
        </li>
        <li>
          <strong>Domain</strong> — the business domain the system belongs to
        </li>
        <li>
          <strong>Language</strong> and <strong>Framework</strong> — the primary tech stack
        </li>
        <li>
          <strong>Services count</strong> — number of services (APIs, workers, cron jobs)
        </li>
        <li>
          <strong>Databases count</strong> — number of registered databases
        </li>
        <li>
          <strong>Integrations count</strong> — number of outbound integrations declared
        </li>
        <li>
          <strong>Documents count</strong> — number of Markdoc documents attached to the system
        </li>
      </ul>
      <p>
        Click any row to navigate to the system detail page.
      </p>

      <h3 id="systems-detail">System detail tabs</h3>
      <p>
        The system detail page (<code>/w/[slug]/systems/[systemSlug]</code>) is
        divided into four tabs:
      </p>

      <h4>Overview</h4>
      <p>
        Shows the system metadata extracted from the inventory: programming language, framework
        and version, domain name, and the repository URL (clickable external link if provided).
      </p>

      <h4>Architecture</h4>
      <p>
        Displays the full inventory of technical components registered for the system:
      </p>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Fields shown</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Services</strong>
            </td>
            <td>Name, type (API / WORKER / CRONJOB / BACKGROUND_SERVICE), port, path</td>
          </tr>
          <tr>
            <td>
              <strong>Databases</strong>
            </td>
            <td>Name, provider, version, ORM</td>
          </tr>
          <tr>
            <td>
              <strong>Integrations</strong>
            </td>
            <td>Target system, integration type, description</td>
          </tr>
          <tr>
            <td>
              <strong>Message topics</strong>
            </td>
            <td>Topic name, broker, role (PRODUCER / CONSUMER / BOTH)</td>
          </tr>
          <tr>
            <td>
              <strong>Packages</strong>
            </td>
            <td>Name, version, scope (INTERNAL / OPEN_SOURCE / TEST) — top 20 shown</td>
          </tr>
        </tbody>
      </table>

      <h4>Risks</h4>
      <p>
        Lists all risk entries declared in the inventory for this system. Each row shows the risk
        title, description, and a color-coded severity badge:
      </p>
      <ul>
        <li>
          <strong>CRITICAL</strong> and <strong>HIGH</strong> — red (destructive)
        </li>
        <li>
          <strong>MEDIUM</strong> — neutral (secondary)
        </li>
        <li>
          <strong>LOW</strong> — outline
        </li>
      </ul>

      <h4>Documentation</h4>
      <p>
        Lists all Markdoc documents attached to the system, showing the title, author, and last
        updated date. EDITOR and OWNER members see a{" "}
        <strong>New Document</strong> button to create a new document inline.
      </p>
    </section>
  );
}
