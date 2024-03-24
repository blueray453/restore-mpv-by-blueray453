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
        // Connect to the position-changed and size-changed signals for the new window
        log(`New window created: with id ${window.get_id()}`);
        window.connect('position-changed', this.onChanged.bind(this));
        window.connect('size-changed', this.onChanged.bind(this));
    }

    onChanged(window) {
        // Handle position change event
        log(`Changed window: with id ${window.get_id()}`);
        // You can perform actions based on the new position here
    }
}

function init() {
    return new Extension();
}
