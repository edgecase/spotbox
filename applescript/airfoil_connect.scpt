on run argv
  tell application "Airfoil"
    disconnect from every speaker

    set airtunes to first speaker whose name is "airtunes"
    set (volume of airtunes) to item 1 of argv

    connect to airtunes
    set connectionStatus to (connected of airtunes)
    return connectionStatus
  end tell
end run
