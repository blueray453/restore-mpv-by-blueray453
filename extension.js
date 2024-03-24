/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */
const { Gio, GLib, GObject, Meta } = imports.gi;

class Extension {
    enable() {
        global.display.connect('window-created', this.onWindowCreated.bind(this));
        log(`restore mpv Enabled`);
    }

    disable() {
        // Disconnect all signal handlers when the extension is disabled
        log(`restore mpv Disabled`);
    }

    onWindowCreated(display, window) {
        // log(`New window created: with id ${window.get_id()}`);

        let wm_class = window.get_wm_class();
        let wm_class_instance = window.get_wm_class_instance();

        if (wm_class === "mpv" && wm_class_instance === "gl") {
            window.connect('position-changed', this.onChanged.bind(this));
            window.connect('size-changed', this.onChanged.bind(this));
            this.restoreWindow(window);
        }
    }

    restoreWindow(window) {
        log(`restoring mpv`);
        const file_path = GLib.build_filenamev([GLib.get_home_dir(), 'mpv-window-details.json']);
        const file = Gio.File.new_for_path(file_path);

        // Check if the file exists
        if (file.query_exists(null)) {
            const [success, contents, _] = file.load_contents(null);
            if (success) {
                let jsonContent = contents.toString();
                try {
                    let data = JSON.parse(jsonContent);
                    let { x, y, width, height } = data;
                    if (window) {
                        if (window.minimized) {
                            window.unminimize();
                        }
                        if (window.maximized_horizontally || window.maximized_vertically) {
                            window.unmaximize(3);
                        }
                        log(`Resizing window to: width ${width}, height ${height}, x ${x}, and y ${y}`);
                        // window.move_resize_frame(1, x, y, width, height);

                        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                            // log(`line before move_resize_frame`);
                            window.move_resize_frame(1, x, y, width, height);
                            return GLib.SOURCE_REMOVE;
                        });

                        // let act = window.get_compositor_private();
                        // let id = act.connect('first-frame', _ => {
                        //     log(`line before move_resize_frame`);
                        //     window.move_resize_frame(1, x, y, width, height);
                        //     act.disconnect(id);
                        // });

                        window.activate(0);

                    } else {
                        throw new Error('Window not found');
                    }
                } catch (error) {
                    log(`Error parsing JSON: ${error}`);
                }
            } else {
                log(`Error loading file contents`);
            }
        } else {
            log(`File does not exist: ${file_path}`);
        }
    }

    onChanged(window) {
        // let winid = window.get_id();
        let wm_class = window.get_wm_class();
        let wm_class_instance = window.get_wm_class_instance();

        if (wm_class === "mpv" && wm_class_instance === "gl") {
            let frameRect = window.get_frame_rect();
            let x = frameRect.x;
            let y = frameRect.y;
            let width = frameRect.width;
            let height = frameRect.height;

            // log(`window changed: with id ${winid} and class ${wm_class} and ${wm_class_instance}where width is ${width} height is ${height} x is ${x} y is ${y}`);

            this.writeToFile(x, y, width, height);
        }
    }

    writeToFile(x, y, width, height) {
        log(`Writing to file`);
        const file_path = GLib.build_filenamev([GLib.get_home_dir(), 'mpv-window-details.json']);
        const file = Gio.File.new_for_path(file_path);
        const outputStream = file.replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        // const outputStreamAppend = file.append_to(Gio.FileCreateFlags.NONE, null);

        let data = {
            x: x,
            y: y,
            width: width,
            height: height
        };

        let to_write = JSON.stringify(data);

        // outputStreamAppend.write_all(to_write, null);
        outputStream.write(to_write, null);
    }
}

function init() {
    return new Extension();
}
