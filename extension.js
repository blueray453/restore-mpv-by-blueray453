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

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import GLib from 'gi://GLib';

export default class GnomeUtils extends Extension {
    enable() {
        const initial_values = { x: 50, y: 100, width: 1920, height: 1080 };

        let stateVariant = GLib.Variant.new_tuple([
            GLib.Variant.new_int32(initial_values.x),
            GLib.Variant.new_int32(initial_values.y),
            GLib.Variant.new_int32(initial_values.width),
            GLib.Variant.new_int32(initial_values.height)]
        );
        // log(`The type of stateVariant is ${stateVariant.get_type()}`);
        // log(`The type_string of stateVariant is ${stateVariant.get_type_string()}`);

        global.set_persistent_state('mpv_window_state', stateVariant);

        global.display.connect('window-created', this.onWindowCreated.bind(this));
        // log(`restore mpv Enabled`);
    }

    disable() {
        // Disconnect all signal handlers when the extension is disabled
        // log(`restore mpv Disabled`);
    }

    onWindowCreated(display, window) {
        // log(`New window created: with id ${window.get_id()}`);

        let wm_class = window.get_wm_class();

        if (wm_class === "mpv") {
            const windowManager = global.window_manager;
            let destroyId = windowManager.connect('destroy', (_, actor) => {
                // log(`Window is about to close`);
                let window = actor.get_meta_window();
                let frameRect = window.get_frame_rect();
                let x = frameRect.x;
                let y = frameRect.y;
                let width = frameRect.width;
                let height = frameRect.height;

                // this.writeToFile(x, y, width, height);
                let stateVariant = GLib.Variant.new_tuple([
                    GLib.Variant.new_int32(x),
                    GLib.Variant.new_int32(y),
                    GLib.Variant.new_int32(width),
                    GLib.Variant.new_int32(height)]
                );

                global.set_persistent_state('mpv_window_state', stateVariant);

                actor.disconnect(destroyId);
            });

            // window.connect('position-changed', this.onChanged.bind(this));
            // window.connect('size-changed', this.onChanged.bind(this));
            let stateVariant = global.get_persistent_state('(iiii)', 'mpv_window_state');
            let [x, y, width, height] = stateVariant.deep_unpack();

            let state = { x, y, width, height };

            if (state) {
                let { x, y, width, height } = state;

                if (window) {
                    if (window.minimized) {
                        window.unminimize();
                    }
                    if (window.maximized_horizontally || window.maximized_vertically) {
                        window.unmaximize(3);
                    }

                    let actor = window.get_compositor_private();
                    let firstFrameId = actor.connect('first-frame', _ => {
                        window.move_resize_frame(1, x, y, width, height);
                        actor.disconnect(firstFrameId);
                    });

                    window.activate(0);
                } else {
                    log(`Error: Window not found`);
                }
            }
        }
    }
}
