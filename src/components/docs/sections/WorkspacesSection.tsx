import { Callout } from "../markdoc/Callout";

export function WorkspacesSection() {
  return (
    <section id="workspaces">
      <h2>Workspaces</h2>
      <p>
        A workspace is the top-level organizational container in Meridian. Each workspace has its
        own systems, domains, dependency graph, team members, and upload history — completely
        isolated from other workspaces.
      </p>

      <h3 id="workspaces-concept">What is a workspace?</h3>
      <p>
        Think of a workspace as a project or an organization boundary. When you upload an
        inventory, resolve dependencies, and visualize a graph, all of that data lives inside a
        specific workspace. Teams typically create one workspace per platform, product, or
        business unit.
      </p>
      <p>
        Each workspace has a unique <strong>slug</strong> that appears in the URL:
        <code>/w/my-workspace/graph</code>. All navigation within the app is scoped to the current
        workspace.
      </p>

      <h3 id="workspaces-creation">Creating a workspace</h3>
      <p>
        Navigate to <strong>/workspaces</strong> after signing in. Click{" "}
        <strong>New workspace</strong>. You will be prompted for:
      </p>
      <ul>
        <li>
          <strong>Name</strong> — human-readable display name (e.g., "My Platform")
        </li>
        <li>
          <strong>Slug</strong> — URL-safe identifier, auto-generated from the name but editable
          (lowercase letters, numbers, and hyphens only, e.g., <code>my-platform</code>)
        </li>
        <li>
          <strong>Description</strong> — optional short description shown on the workspace card
        </li>
      </ul>
      <p>
        After creation you are redirected to <code>/w/[slug]/dashboard</code> and
        automatically assigned the <code>OWNER</code> role.
      </p>

      <h3 id="workspaces-roles">Roles & permissions</h3>
      <p>
        Every workspace member holds one of three roles. Roles control what actions a member can
        perform:
      </p>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>View graph & systems</th>
            <th>Upload inventory</th>
            <th>Create & edit docs</th>
            <th>Manage members</th>
            <th>Change settings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>OWNER</code>
            </td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>
              <code>EDITOR</code>
            </td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>
              <code>VIEWER</code>
            </td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>
      <Callout type="note" title="One owner per workspace">
        Each workspace has a single owner. Ownership can be transferred to another member in
        workspace settings.
      </Callout>

      <h3 id="workspaces-switching">Navigation & switching workspaces</h3>
      <p>
        The top header shows the name of the current workspace. Click it to open a dropdown that
        lists all workspaces you belong to. Select any workspace to switch to it immediately.
      </p>
      <p>The header navigation bar contains the following pages for each workspace:</p>
      <ul>
        <li>
          <strong>Dashboard</strong> — metrics, charts, and recent activity
        </li>
        <li>
          <strong>Graph</strong> — interactive dependency graph
        </li>
        <li>
          <strong>Systems</strong> — searchable list of all registered systems
        </li>
        <li>
          <strong>Upload</strong> — inventory upload (EDITOR and OWNER only)
        </li>
        <li>
          <strong>Settings</strong> — workspace settings and members (EDITOR and OWNER only)
        </li>
      </ul>
    </section>
  );
}
