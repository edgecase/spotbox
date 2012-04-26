on run
  tell application "Airfoil"
    disconnect from every speaker
    set airtunes to first speaker whose name is "airtunes"
    set connectionStatus to (connected of airtunes)
    return connectionStatus
  end tell
end run
