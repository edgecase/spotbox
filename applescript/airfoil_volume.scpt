on run argv
  tell application "Airfoil"
    set airtunes to first speaker whose name is "airtunes"
    set (volume of airtunes) to item 1 of argv
  end tell
end run
