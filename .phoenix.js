Phoenix.set({
  daemon: false,
  openAtLogin: true
});

function osascript(script, callback = _.noop) {
  const args = script.trim().split(/\r?\n/).reduce((r, line) => r.concat("-e", line), []);
  Task.run("/usr/bin/osascript", args, callback);
}

function switchSpace(space, callback = _.noop) {
  // In order to make this work you have to open System Preferences > Keyboard > Shortcuts > Mission Control and bind all Switch to Desktop [NUMBER] actions to ctrl + alt + cmd + shift + [NUMBER].
  if(Screen.all().some((s) => s.currentSpace().isEqual(space))) return;
  const spaceIndex = Space.all().findIndex(s => s.isEqual(space)),
        keycodes = [18, 19, 20, 21, 23, 22, 26, 28, 25],
        keycode = keycodes[spaceIndex] ? `${keycodes[spaceIndex]}` : "",
        script = `
    tell application "System Events" to key code {${keycode}} using {control down, option down, command down, shift down}
    delay 0.5
  `;
  Phoenix.log(`Switching to Desktop ${spaceIndex + 1}...`);
  osascript(script, callback);
}

function createSpace(screen, callback = _.noop) {
  const screenIndex = Screen.all().findIndex(s => s.isEqual(screen)),
        script = `
    tell application "System Events"
        tell application "Mission Control" to launch
        tell group 2 of group ${screenIndex + 1} of group 1 of process "Dock"
            click (every button whose value of attribute "AXDescription" is "add desktop")
            delay 0.5
            -- Switch to the new space:
            --tell list 1
            --    set countSpaces to count of buttons
            --    delay 0.5
            --    click button (countSpaces)
            --end tell
        end tell
        key code 53
        delay 0.5
    end tell
  `;
  Phoenix.log(`Creating space on screen ${screenIndex + 1}...`);
  osascript(script, callback);
}

function compareWindows(a, b) {
  const frameA = a.frame(),
        frameB = b.frame();
  if(frameA.x < frameB.x) return -1; // a before b if a is more to the left than b
  if(frameA.x > frameB.x) return 1; // b before a if b is more to the left than a
  if(frameA.y < frameB.y) return -1; // a before b if a is higher than b
  if(frameA.y > frameB.y) return 1; // b before a if b is higher than a
  return a.title() <= b.title() ? -1 : 1;
}

function organise(screens) {
  // Determine maximum number of windows for the first screen: 2 for ultrawides, 1 for regular screens.
  if(!screens || !screens.length) return;
  const screen = screens[0],
        maxWindowsPerScreen = Math.floor(screen.frame().width / screen.frame().height);
  // Determine actual windows to be managed and sort them according to priority.
  const screenWindows = screen.windows().filter(w => w.isNormal() && w.isVisible());
  screenWindows.sort(compareWindows);
  // Fill space with maxWindowsPerScreen windows, in equal columns.
  const numWindows = Math.min(maxWindowsPerScreen, screenWindows.length);
  for(var i = 0; i < numWindows; i++) {
    Phoenix.log(`Filling current space with ${numWindows} windows...`);
    const columnWidth = Math.floor(screen.flippedVisibleFrame().width / numWindows);
    newFrame = screen.flippedVisibleFrame();
    newFrame.x += i * columnWidth;
    newFrame.width = Math.floor(newFrame.width / numWindows);
    screenWindows[i].setFrame(newFrame);
  }
  // Move excess windows from this space to the next.
  if(screenWindows.length > maxWindowsPerScreen) {
    const currentSpace = screen.currentSpace(),
          screenSpaces = screen.spaces(),
          nextSpaceIndex = screenSpaces.findIndex(s => s.isEqual(currentSpace)) + 1;
    if(nextSpaceIndex >= screenSpaces.length) {
      createSpace(screen, () => organise(screens));
    } else {
      const moveWindows = screenWindows.slice(maxWindowsPerScreen),
            nextSpace = screenSpaces[nextSpaceIndex];
      Phoenix.log(`Moving ${moveWindows.length} windows to the next space...`)
      nextSpace.addWindows(moveWindows);
      currentSpace.removeWindows(moveWindows);
      switchSpace(nextSpace, () => organise(screens));
    }
  } else {
    screens.shift();
    organise(screens);
  }
}

Key.on("return", [ "command", "option" ], function () {
  organise(Screen.all());
});
