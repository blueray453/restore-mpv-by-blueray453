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
const { GObject, Meta } = imports.gi;

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
        log(`New window created: with id ${window.get_id()}`);
        window.connect('position-changed', this.onChanged.bind(this));
        window.connect('size-changed', this.onChanged.bind(this));
    }

    onChanged(window) {
        let winid = window.get_id();
        let wm_class = window.get_wm_class();
        let wm_class_instance = window.get_wm_class_instance();

        let frameRect = window.get_frame_rect();
        let x = frameRect.x;
        let y = frameRect.y;
        let width = frameRect.width;
        let height = frameRect.height;

        log(`window changed: with id ${winid} and class ${wm_class} and ${wm_class_instance}where width is ${width} height is ${height} x is ${x} y is ${y}`);
    }
}

function init() {
    return new Extension();
}
