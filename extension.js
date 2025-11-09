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
import { setLogging, setLogFn, journal } from './utils.js'

import GLib from 'gi://GLib';

const windowManager = global.get_window_manager();

export default class GnomeUtils extends Extension {

    enable() {
        if (this.getLogger) {
            // Use ExtensionBase's logger class on GNOME 48+
            const logger = this.getLogger()

            setLogFn(function (msg, error) {
                if (error) {
                    logger.error(msg)
                } else {
                    logger.log(msg)
                }
            })
        }

        setLogging(true)

        // // logs only if loggingEnabled=true
        // journal("This is a regular log message");

        // // always logs, even if logging is off
        // journal("This is an error message", true);

        journal(`Enabled`)

        // // Get total screen dimensions
        // const screenWidth = global.get_screen_width();
        // const screenHeight = global.get_screen_height();

        // journal(`screenWidth: ${screenWidth}`)
        // journal(`screenHeight: ${screenHeight}`)

        // console.log(`[restore-mpv-by-blueray453] Enabled ${testvar}`);

        const initial_values = { x: 100, y: 100, width: 1920, height: 1080 };

        this.saveWindowState(initial_values);

        this._windowCreatedId = global.display.connect('window-created', this.onWindowCreated.bind(this));
        // log(`restore mpv Enabled`);
    }

    disable() {

        if (this._windowCreatedId) {
            global.display.disconnect(this._windowCreatedId);
            this._windowCreatedId = null;
        }

        journal(`Disabled`)
        // this.logger.log("Disabled");
        // Disconnect all signal handlers when the extension is disabled
        // log(`restore mpv Disabled`);
    }

    moveResizeWindow(window, { x, y, width, height }) {
        if (!window) return;

        // Unminimize if minimized
        if (window.minimized) {
            window.unminimize();
        }

        // Unmaximize if maximized
        if (window.maximized_horizontally || window.maximized_vertically) {
            window.unmaximize(3);
        }

        // Move and resize after first frame
        const actor = window.get_compositor_private();
        const firstFrameId = actor.connect('first-frame', () => {
            window.move_resize_frame(1, x, y, width, height);
            actor.disconnect(firstFrameId);
        });

        window.activate(0);
    }

    saveWindowState({ x, y, width, height }) {
        const stateVariant = new GLib.Variant('a{sv}', {
            x: GLib.Variant.new_int32(x),
            y: GLib.Variant.new_int32(y),
            width: GLib.Variant.new_int32(width),
            height: GLib.Variant.new_int32(height)
        });

        global.set_persistent_state('mpv_window_state', stateVariant);
    }

    onWindowCreated(display, window) {
        // log(`New window created: with id ${window.get_id()}`);

        let wm_class = window.get_wm_class();

        if (wm_class === "mpv") {

            let destroyId = windowManager.connect('destroy', (_, actor) => {
                // log(`Window is about to close`);
                let window = actor.get_meta_window();
                let { x, y, width, height } = window.get_frame_rect();

                this.saveWindowState({ x, y, width, height });

                actor.disconnect(destroyId);
            });

            // window.connect('position-changed', this.onChanged.bind(this));
            // window.connect('size-changed', this.onChanged.bind(this));
            let { x, y, width, height } = global.get_persistent_state('a{sv}', 'mpv_window_state').recursiveUnpack();

            this.moveResizeWindow(window, { x, y, width, height });
        }
    }
}
