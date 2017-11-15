const _ = require('lodash')
const fs = require('fs-extra-promise')
const path = require('path')
const ScreepsServer = require('./')

process.on('unhandledPromiseRejection', (err) => {
  console.error(err, err.stack)
})

;(async function () {
  await fs.removeAsync(path.join(__dirname, 'server')).catch(err => console.error(err))

  try {
    const server = new ScreepsServer()

    // Reset batabase
    await server.world.reset()

    // Add our bot and subscribe to console logs
    const modules = {
      main: `module.exports.loop = function() {
        console.log('Tick!', Game.time);
        Game.spawns.Spawn1.createCreep([MOVE]);
        _.each(Game.creeps, c => c.move(Math.ceil(Math.random() * 8)))
        if (Game.time === 5) throw new Error('error')
      }`
    }
    let user = await server.world.addBot({ username: 'bot', room: 'W0N0', x: 25, y: 25, modules })
    user.on('console', (log, results, userid, username) => {
      log.forEach(l => console.log('[console.log]', l))
      results.forEach(r => console.log('[console.results]', r))
    })

    // Start engine processes
    console.log('Starting server')
    await server.start()

    // Run several ticks
    console.log('Game time:', await server.world.gameTime)
    for (let i = 0; i < 10; i++) {
      await server.tick()
      await user.console(`console.log(Game.time, 'should equal', ${i + 1})`)
    ;(await user.newNotifications).forEach(n => console.log('[notification]', n))
    }
    console.log('Game time:', await server.world.gameTime)
    ;(await user.notifications).forEach(n => console.log('[notification]', n))
    console.log('[memory]', await user.memory)
    //console.log(await server.world.roomObjects('W0N0'))

    // Stop server
    console.log('Done, killing process.')
    server.stop()
    setTimeout(() => process.exit(), 1000) // needed due to open db connections keeping process open
  } catch(err) {
    console.log(err, err.stack)
    process.exit()
  }
})()
