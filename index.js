// module for tera-proxy
module.exports = function commandsList(dispatch) {
    const command = dispatch.command || dispatch.require.command

    const fs = require('fs'),
        path = require('path')

    const directory = path.join(__dirname, '..')

    // ignore files/folders which start with these characters: i.e. ".git" or "_old"
    const IGNORED_CHARACTERS = [
        '.',
        '_'
    ]

    // variables
    let reading = 0,
        commandList = []

    // read all module's commands
    getFiles()

    // print out list of commands
    command.add(['commands', 'coms'], commandHandler)

    function commandHandler () {
        if (reading === 0) {
            let message = ''
            for (let command of commandList) {
                message += `\n[${command[0]}] "${command[1]}"`
            }
            command.message(message)
        }
        else setTimeout(commandHandler, 500)
    }

    // get files
    function getFiles(relativePath = '', files) {
        let dir = path.join(directory, relativePath)
        if (!files) files = fs.readdirSync(dir, 'utf8')
        for (let file of files) {
            // if not ignored file or begins with ignored character
            if (!IGNORED_CHARACTERS.includes(file[0])) {
                reading += 1
                fs.readdir(path.join(dir, file), 'utf8', (err, moreFiles) => {
                    if (moreFiles) {
                        getFiles(path.join(relativePath, file), moreFiles)
                    }
                    else {
                        getCommands(path.join(relativePath, file))
                    }
                    reading -= 1
                })
            }
        }
    }

    // get commands
    function getCommands(file) {
        if (file.slice(-4).includes('.js')) {
            let data = fs.readFileSync(path.join(directory, file), 'utf8')
            // ignore comments
            data = data.replace(/\/\/.*\/\*(?!.*\*\/)/g,'') // ignore: // ... /* ...
            data = data.replace(/\/\*[^]*?\*\//gm,'') // ignore: /* ... */
            data = data.replace(/\/\/.*/g,'') // ignore: // ...
            // X.add("command" or X.add(["command1", "command2", ...]
            let commands = data.match(/\w\.add\(\s*?(['"`][\S]+?['"`]|\[\s*?['"`][\S]+?['"`][^]*?\])/igm)
            if (commands) {
                //console.log(file, commands)
                // folder-name/... or file-name.js
                let name = file.slice(0, file.search(/[\/\\]|\.js/))
                if (!Array.isArray(commands)) commands = [commands]
                for (let command of commands) {
                    command = [name, command.slice(6)]
                    try {
                        command[1] = eval(command[1])
                        if (Array.isArray(command[1])) {
                            command[1] = command[1].toString().replace(/,/igm, '", "')
                        }
                        commandList.push(command)
                    }
                    catch (err) {
                        // do nothing
                    }
                }
            }
        }
    }
}
