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
import Gio from 'gi://Gio';

const windowManager = global.get_window_manager();
const Display = global.get_display();

export default class GnomeUtils extends Extension {

    enable() {
        // // journalctl /usr/bin/gnome-shell -f -o cat | grep "\[Restore MPV by blueray453\]"

        // if (this.getLogger) {
        //     // Use ExtensionBase's logger class on GNOME 48+
        //     const logger = this.getLogger()

        //     setLogFn(function (msg, error) {
        //         if (error) {
        //             logger.error(msg)
        //         } else {
        //             logger.log(msg)
        //         }
        //     })
        // }

        // journalctl -f -o cat SYSLOG_IDENTIFIER=restore-mpv-by-blueray453
        // journalctl -f -o verbose SYSLOG_IDENTIFIER=restore-mpv-by-blueray453
        // journalctl -f -o json SYSLOG_IDENTIFIER=restore-mpv-by-blueray453 | jq -r '."CODE_FILE", ."MESSAGE"'

        setLogFn((msg, error = false) => {
            let level;
            if (error) {
                level = GLib.LogLevelFlags.LEVEL_CRITICAL;
            } else {
                level = GLib.LogLevelFlags.LEVEL_MESSAGE;
            }

            GLib.log_structured(
                'restore-mpv-by-blueray453',
                level,
                {
                    MESSAGE: `${msg}`,
                    SYSLOG_IDENTIFIER: 'restore-mpv-by-blueray453',
                    CODE_FILE: GLib.filename_from_uri(import.meta.url)[0]
                }
            );
        });


        setLogging(true)

        // // logs only if loggingEnabled=true
        // journal("This is a regular log message");

        // // always logs, even if logging is off
        // journal("This is an error message", true);

        journal(`Enabled`)

        // console.log(`[restore-mpv-by-blueray453] Enabled ${testvar}`);

        global.set_persistent_state('mpv_window_state', null);

        this._windowCreatedId = Display.connect('window-created', this.onWindowCreated.bind(this));
        // log(`restore mpv Enabled`);
        this._WindowDestroyId = windowManager.connect('destroy', this.onWindowDestroy.bind(this));
    }

    disable() {
        if (this._windowCreatedId) {
            Display.disconnect(this._windowCreatedId);
            this._windowCreatedId = null;
        }

        if (this._WindowDestroyId) {
            windowManager.disconnect(this._WindowDestroyId);
            this._WindowDestroyId = null;
        }

        journal(`Disabled`)
        // this.logger.log("Disabled");
    }

    moveResizeWindow(window, { x, y, width, height }) {
        if (!window) return;

        journal(`moving window`)

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

        journal(`moved window`)
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

    onWindowDestroy(_, actor) {
        journal(`Window is about to close`);

        let window = actor.get_meta_window();

        let wm_class = window.get_wm_class();

        if (wm_class === "mpv") {

            if (window.is_fullscreen()){
                window.unmake_fullscreen();
                journal(`unmaking fullscreen`);
            }

            let { x, y, width, height } = window.get_frame_rect();

            this.saveWindowState({ x, y, width, height });
        }
    }

    onWindowCreated(display, window) {

        let wm_class = window.get_wm_class();

        if (wm_class === "mpv") {

            journal(`wm class is mpv`)

            let x, y, width, height;  // declare variables in outer scope

            let mpvWindowState = global.get_persistent_state('a{sv}', 'mpv_window_state');

            journal(`mpvWindowState: ${mpvWindowState}`)

            if (mpvWindowState === null) {

                journal(`mpvWindowState: is null`)

                width = 1920;
                height = 1080;

                x = 0;
                y = 0;

                // const monitor = display.get_primary_monitor();
                // const screenGeometry = display.get_monitor_geometry(monitor);
                // const screenWidth = screenGeometry.width;
                // const screenHeight = screenGeometry.height;
                // journal(`screenWidth: ${screenWidth}`)
                // journal(`screenHeight: ${screenHeight}`)

                // // // Get total screen dimensions
                // // const screenWidth = global.get_screen_width();
                // // const screenHeight = global.get_screen_height();
                // // Get total screen dimensions
                // const screenWidth = global.get_screen_width();
                // const screenHeight = global.get_screen_height();

                // // journal(`screenWidth: ${screenWidth}`)
                // // journal(`screenHeight: ${screenHeight}`)

                // x = Math.floor((screenWidth - width) / 2);
                // y = Math.floor((screenHeight - height) / 2);


                // const initial_values = { x: 0, y: 0, width: 1920, height: 1080 };
                // ({ x, y, width, height } = initial_values); // destructure assignment

            } else {
                journal(`mpvWindowState: is not null`)

                journal(`mpvWindowState: ${mpvWindowState.print(true)}`);

                // ({ x, y, width, height } = mpvWindowState.recursiveUnpack()); // destructure assignment

                let windowGeometry = mpvWindowState.recursiveUnpack();

                x = windowGeometry.x;
                y = windowGeometry.y;
                width = windowGeometry.width;
                height = windowGeometry.height;
            }

            // window.connect('position-changed', this.onChanged.bind(this));
            // window.connect('size-changed', this.onChanged.bind(this));

            journal(`x: ${x}`)
            journal(`y: ${y}`)
            journal(`width: ${width}`)
            journal(`height: ${height}`)

            this.moveResizeWindow(window, { x, y, width, height });
        }
    }
}
