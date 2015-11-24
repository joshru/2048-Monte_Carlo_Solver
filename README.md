# 2048

Original 2048 game by Gabriel Cirulli [Play it here!](http://gabrielecirulli.github.io/2048/)

The official app can also be found on the [Play Store](https://play.google.com/store/apps/details?id=com.gabrielecirulli.app2048) and [App Store!](https://itunes.apple.com/us/app/2048-by-gabriele-cirulli/id868076805)

### Project
Game was created for my Artificial Intelligence class. The goal was to create an agent that can consistently win games of 2048. This agent is able to win nearly every time but its implementation is far from perfect. I ended up using Monte Carlo to search for the best solutions on the game board but implementing an expectiminimax search would be much better.

Monte Carlo works by taking a serialized version of the board and simulating log2(largestTile) * 8 number of games to find out which initial direction yeilds the highest score on average. Because the algorithm has to simulate so many complete virtual games for each individual moves its performance leaves something to be desired. 

### Screenshot

<p align="center">
  <img src="http://i.imgur.com/oyDB19j.png" alt="Screenshot"/>
</p>
Screenshot is from a game that was in progress. The algorithm will actually reach the 4096 tile fairly frequently.

## Contributing
Changes and improvements are more than welcome! Feel free to fork and open a pull request. Please make your changes in a specific branch and request to pull into `master`! If you can, please make sure the game fully works before sending the PR, as that will help speed up the process.

You can find the same information in the [contributing guide.](https://github.com/gabrielecirulli/2048/blob/master/CONTRIBUTING.md)

## License
2048 is licensed under the [MIT license.](https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt)


