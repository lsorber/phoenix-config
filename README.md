# Phoenix config

This [Phoenix](https://github.com/kasper/phoenix) config attempts to automate window managent across multiple screens and spaces.

# Installation

1. [Install Phoenix](https://github.com/kasper/phoenix#install).
2. In the macOS menu bar, click on Phoenix > Edit configuration.
3. Paste the contents of `.phoenix.js`.

# Usage

Press ⌥+⌘+⏎ to organise your windows across your screens and their respective spaces as follows:

1. On each screen, each space is divided into equal columns so that each column has an aspect ratio of at least 1:1 (but not more than 2:1). For example, an ultrawide 21:9 screen would have 2 columns per space, and a widescreen 16:9 would have 1 column per space.
2. On each screen, your active space's windows are greedily assigned to fill the space's columns.
3. If there are more windows that fit in the current space's columns, they are moved to the next space and (2) is repeated. If there is no next space, one will be created automatically.
