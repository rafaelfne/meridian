import { Callout } from "../markdoc/Callout";

export async function GraphViewSection() {
  return (
    <section id="graph-view">
      <h2>Graph View</h2>
      <p>
        The Graph page is the core of Meridian. It renders an interactive visualization of all
        systems in the workspace and the dependency edges between them, resolved from your
        inventory uploads. Navigate to <strong>Graph</strong> in the workspace header to open it.
      </p>

      <h3 id="graph-toolbar">Toolbar & filters</h3>
      <p>
        The toolbar at the top of the graph provides controls to filter and configure what is
        displayed. All filter states are persisted to the URL as query parameters, making filtered
        views fully shareable.
      </p>
      <table>
        <thead>
          <tr>
            <th>Control</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Search</strong>
            </td>
            <td>Filter nodes by system name in real time as you type</td>
          </tr>
          <tr>
            <td>
              <strong>Domain</strong>
            </td>
            <td>Multi-select dropdown to show only systems belonging to selected domains</td>
          </tr>
          <tr>
            <td>
              <strong>Dependency type</strong>
            </td>
            <td>
              Multi-select with color-coded swatches to show only specific edge types (HTTP, Kafka,
              shared database, etc.)
            </td>
          </tr>
          <tr>
            <td>
              <strong>Language</strong>
            </td>
            <td>Multi-select to filter systems by programming language</td>
          </tr>
          <tr>
            <td>
              <strong>Isolated</strong>
            </td>
            <td>
              Toggle to show or hide systems that have no dependency connections (eye icon)
            </td>
          </tr>
          <tr>
            <td>
              <strong>Flow animation</strong>
            </td>
            <td>
              Toggle particle animations on messaging edges (Kafka, RabbitMQ, SQS). Uses a
              lightning bolt icon.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Layered layout</strong>
            </td>
            <td>
              Switch between free-form layout and a topological 3-layer layout (EDGE →
              BUSINESS_LOGIC → DATA_INFRA)
            </td>
          </tr>
          <tr>
            <td>
              <strong>Cluster</strong>
            </td>
            <td>
              Group nodes visually by business domain. At zoom levels below 0.4, domains
              automatically collapse into a single node.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Reset filters</strong>
            </td>
            <td>
              Clears all active filters (only visible when at least one filter is active)
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        A counter below the toolbar shows the number of visible systems and edges vs. the total:
        e.g., <code>12 / 24 systems · 8 / 31 dependencies</code>.
      </p>

      <h3 id="graph-layout-modes">Layout modes</h3>
      <p>Meridian supports three layout modes for the graph:</p>
      <ul>
        <li>
          <strong>Free-form</strong> (default) — nodes are positioned automatically by a
          force-directed algorithm. You can drag nodes anywhere; positions are saved per layout
          mode in local storage.
        </li>
        <li>
          <strong>Layered</strong> — activates a topological layout that places systems in three
          horizontal layers based on their declared <code>layer</code> field:{" "}
          <code>EDGE</code> (user-facing), <code>BUSINESS_LOGIC</code> (internal services), and{" "}
          <code>DATA_INFRA</code> (databases, queues, infrastructure). Useful for understanding
          architectural tiers.
        </li>
        <li>
          <strong>Clustered</strong> — groups nodes inside domain containers. When you zoom out
          below 0.4×, individual nodes collapse into a single domain node to reduce visual noise.
          Click a collapsed domain node to expand it.
        </li>
      </ul>

      <h3 id="graph-nodes">Node interactions</h3>
      <p>
        Each node in the graph represents a system. Nodes display the system name, domain badge,
        programming language, and service ports. Service types use abbreviated labels:
      </p>
      <table>
        <thead>
          <tr>
            <th>Service type</th>
            <th>Badge label</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>API</td>
            <td>
              <code>API</code>
            </td>
          </tr>
          <tr>
            <td>WORKER</td>
            <td>
              <code>WKR</code>
            </td>
          </tr>
          <tr>
            <td>CRONJOB</td>
            <td>
              <code>CRON</code>
            </td>
          </tr>
          <tr>
            <td>BACKGROUND_SERVICE</td>
            <td>
              <code>BG</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>Nodes support the following interactions:</p>
      <ul>
        <li>
          <strong>Click</strong> — opens the <strong>System Detail Panel</strong> on the right
          side of the screen, showing the system metadata, services, databases, integrations,
          and risks
        </li>
        <li>
          <strong>Highlight button</strong> — click the waypoints icon on a node to activate a
          highlight session: connected edges are highlighted and all unrelated nodes fade to near-
          invisible (opacity 0.08)
        </li>
        <li>
          <strong>Risk badge</strong> — if the system has risks, a badge showing the risk count
          appears on the node
        </li>
        <li>
          <strong>Drag</strong> — grab and move any node to reposition it; the new position is
          saved automatically
        </li>
      </ul>

      <h3 id="graph-edge-types">Edge types & colors</h3>
      <p>
        Every dependency edge is color-coded based on its type. Messaging edges (Kafka, RabbitMQ,
        SQS) also display flowing particle animations to indicate data flow direction.
      </p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Color</th>
            <th>Animated</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>HTTP_API</code>
            </td>
            <td>Indigo · #4f46e5</td>
            <td>No</td>
            <td>REST or HTTP API calls between systems</td>
          </tr>
          <tr>
            <td>
              <code>KAFKA_TOPIC</code>
            </td>
            <td>Green · #059669</td>
            <td>Yes</td>
            <td>Kafka topic relationships (producer → consumer)</td>
          </tr>
          <tr>
            <td>
              <code>RABBITMQ_QUEUE</code>
            </td>
            <td>Violet · #A855F7</td>
            <td>Yes</td>
            <td>RabbitMQ queue relationships</td>
          </tr>
          <tr>
            <td>
              <code>SQS_QUEUE</code>
            </td>
            <td>Yellow · #EAB308</td>
            <td>Yes</td>
            <td>AWS SQS queue relationships</td>
          </tr>
          <tr>
            <td>
              <code>SHARED_DATABASE</code>
            </td>
            <td>Amber · #d97706</td>
            <td>No</td>
            <td>Two systems connecting to the same database (same name + provider)</td>
          </tr>
          <tr>
            <td>
              <code>CROSS_DATABASE_QUERY</code>
            </td>
            <td>Red · #dc2626</td>
            <td>No</td>
            <td>Direct cross-database queries between systems</td>
          </tr>
          <tr>
            <td>
              <code>SHARED_PACKAGE</code>
            </td>
            <td>Purple · #7c3aed</td>
            <td>No</td>
            <td>Two systems depending on the same internal package</td>
          </tr>
          <tr>
            <td>
              <code>GRPC</code>
            </td>
            <td>Cyan · #0891b2</td>
            <td>No</td>
            <td>gRPC calls between systems</td>
          </tr>
          <tr>
            <td>
              <code>FILE_DEPENDENCY</code>
            </td>
            <td>Gray · #6b7280</td>
            <td>No</td>
            <td>File system or artifact dependencies</td>
          </tr>
        </tbody>
      </table>
      <p>
        A legend below the filters shows all currently visible edge types with their corresponding
        color swatches.
      </p>

      <h3 id="graph-edge-interactions">Edge interactions</h3>
      <p>Edges support two main interactions:</p>
      <ul>
        <li>
          <strong>Click</strong> — opens a popup showing the source system, target system,
          dependency type, and the specific target service slug (e.g., which API service or
          message topic the edge targets)
        </li>
        <li>
          <strong>Drag</strong> — click and drag any edge to adjust its path offset. Edges follow
          an orthogonal step path with rounded corners. Dragging adjusts the X offset (shifts the
          two vertical bends left/right) and Y offset (shifts the middle horizontal segment
          up/down). Offsets are saved per layout mode in local storage.
        </li>
      </ul>
      <p>
        Hovering an edge reveals a semi-transparent glow, a midpoint dot, and faint{" "}
        <em>depends on</em> / <em>consumed by</em> labels near the source and target.
      </p>

      <h3 id="graph-time-machine">Time machine</h3>
      <p>
        The time machine slider at the bottom of the graph lets you travel back through the
        history of your graph as it was after each inventory upload. Drag the slider to a previous
        upload to see the state of the dependency graph at that point in time.
      </p>
      <p>
        This is useful for understanding how your architecture evolved, spotting when new
        dependencies were introduced or removed, and reviewing the impact of past changes.
      </p>
      <Callout type="note" title="Snapshots are saved automatically">
        Meridian saves a graph snapshot after each successful inventory upload. The time machine
        only shows entries where at least one snapshot exists.
      </Callout>

      <h3 id="graph-command-search">Command search (⌘K)</h3>
      <p>
        Press <kbd>Cmd+K</kbd> (macOS) or <kbd>Ctrl+K</kbd> (Windows/Linux) to open the command
        palette. Type any system name to search across all systems in the workspace. Selecting a
        result focuses the graph on that node and centers it in the viewport.
      </p>

      <h3 id="graph-highlighting">Highlight navigation</h3>
      <p>
        Activating the highlight mode on a node (via the waypoints button) starts a{" "}
        <strong>highlight session</strong>:
      </p>
      <ul>
        <li>All edges connected to the highlighted node (inbound and outbound) remain fully visible</li>
        <li>All unrelated nodes and edges fade to near-invisible (opacity 0.08)</li>
        <li>
          A navigation bar appears at the bottom of the graph with{" "}
          <strong>Previous</strong> and <strong>Next</strong> arrow buttons to cycle through the
          connected systems one by one
        </li>
        <li>
          The currently focused connected node is highlighted in blue; the source node is
          highlighted in green
        </li>
      </ul>
      <p>
        Click the highlighted node again or press <kbd>Escape</kbd> to exit the highlight session
        and return to the normal graph view.
      </p>
    </section>
  );
}
