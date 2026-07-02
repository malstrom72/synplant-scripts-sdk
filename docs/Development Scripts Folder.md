# Development Scripts Folder

For quicker round-trips, keep your scripts in a project folder and point Synplant's Scripts folder at
it with a symbolic link, so the files you edit are the ones Synplant loads. This pairs well with the
[live scripting bridge](../README.md#live-scripting-bridge): edit a file, then reload over the bridge
with `sp_eval("performCushyAction('reload')")`.

Confirm the exact folder with **Open Scripts Folder** first, and copy its current contents into your
project so nothing already installed is lost. On macOS the folder is normally:

```text
/Library/Application Support/Sonic Charge/Synplant Scripts/
```

Copy it into your project, move the original aside as a backup, then create the link (the
`/Library` location needs administrator rights, hence `sudo`):

```sh
mkdir -p "/path/to/my-synplant-scripts"
cp -R "/Library/Application Support/Sonic Charge/Synplant Scripts" \
  "/path/to/my-synplant-scripts/scripts"
sudo mv "/Library/Application Support/Sonic Charge/Synplant Scripts" \
  "/Library/Application Support/Sonic Charge/Synplant Scripts.backup"
sudo ln -s "/path/to/my-synplant-scripts/scripts" \
  "/Library/Application Support/Sonic Charge/Synplant Scripts"
```

If an interactive `sudo` password prompt is inconvenient, macOS' native administrator dialog can run
the privileged link step instead. After copying the current folder into the project and moving the
original aside, run:

```sh
osascript -e 'do shell script "rm -f \"/Library/Application Support/Sonic Charge/Synplant Scripts\" && ln -s \"/path/to/my-synplant-scripts/scripts\" \"/Library/Application Support/Sonic Charge/Synplant Scripts\"" with administrator privileges'
```

The `with administrator privileges` clause runs the whole shell script as root from one GUI prompt,
so both the `rm` and `ln -s` operations are covered.

If `ls -ld` or `readlink` shows that the exact live folder opened by Synplant is already a symlink to
another workspace, do not repeat the `mv ... .backup` step. The original folder was already preserved
during the first setup. Re-link by removing the existing symlink and creating the new one; `rm` on a
symlink removes only the link, never its target.

On Windows, confirm the folder with **Open Scripts Folder**, then copy it into your project, move the
original aside, and create a directory junction. Before the bridge is installed, the SDK helper can
usually locate the same folder from the Sonic Charge registry keys:

```powershell
powershell -ExecutionPolicy Bypass -File tools\locate-scripts-folder.ps1 -Verify
```

Treat that output as a candidate to confirm, not as a substitute for the exact folder opened by
Synplant. The live folder may be under `C:\Program Files\Sonic Charge\Synplant Scripts`, which
normally requires elevation to modify; a one-time junction avoids repeated elevated copies while
iterating.

```bat
xcopy "<Synplant Scripts folder>" "C:\path\to\my-synplant-scripts\scripts\" /E /I
ren "<Synplant Scripts folder>" "Synplant Scripts.backup"
mklink /J "<Synplant Scripts folder>" "C:\path\to\my-synplant-scripts\scripts"
```

After linking, the scripts in your project `scripts` directory are the same ones Synplant sees. To
revert, remove the link and rename the `Synplant Scripts.backup` folder back.
