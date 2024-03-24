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

var MyExtension = class MyExtension {
    constructor() {
        this._signalHandlers = [];
    }

    enable() {
        // Connect the signal handlers when the extension is enabled
        this._signalHandlers.push(global.display.connect('window-created', this._onWindowCreated.bind(this)));
    }

    disable() {
        // Disconnect all signal handlers when the extension is disabled
        this._signalHandlers.forEach(handler => global.display.disconnect(handler));
    }

    _onWindowCreated(display, window) {
        // Check if the newly created window matches the desired criteria
        if (window.get_wm_class_instance() === 'gl' && window.get_wm_class() === 'mpv') {
            // Connect position-changed and size-changed signals for the matching window
            this._signalHandlers.push(window.connect('position-changed', this._onWindowPositionChanged.bind(this, window)));
            this._signalHandlers.push(window.connect('size-changed', this._onWindowSizeChanged.bind(this, window)));
        }
    }

    _onWindowPositionChanged(window, actor, event) {
        // Handle position change event for the specified window
        let [x, y] = actor.get_position();
        log(`Window position changed: (${x}, ${y})`);
    }

    _onWindowSizeChanged(window, actor, event) {
        // Handle size change event for the specified window
        let [width, height] = actor.get_size();
        log(`Window size changed: ${width}x${height}`);
    }
};

function init() {
    return new MyExtension();
}
