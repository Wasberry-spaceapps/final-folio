// Original portfolio template by Bruno Simon (https://github.com/brunosimon/folio-2025) — MIT License
import * as THREE from 'three/webgpu'

const text = `
██╗    ██╗ █████╗ ███████╗██╗██╗   ██╗
██║    ██║██╔══██╗██╔════╝██║██║   ██║
██║ █╗ ██║███████║███████╗██║██║   ██║
██║███╗██║██╔══██║╚════██║██║██║   ██║
╚███╔███╔╝██║  ██║███████║██║╚██████╔╝
 ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝

███╗   ███╗██╗   ██╗████████╗ █████╗ ██╗██████╗ ██╗   ██╗
████╗ ████║██║   ██║╚══██╔══╝██╔══██╗██║██╔══██╗██║   ██║
██╔████╔██║██║   ██║   ██║   ███████║██║██████╔╝██║   ██║
██║╚██╔╝██║██║   ██║   ██║   ██╔══██║██║██╔══██╗██║   ██║
██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║██║██║  ██║╚██████╔╝
╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝

╔═ Intro ═══════════════╗
║ Thank you for visiting my portfolio, you curious developer!
║ — Wasiu Mutairu | Medical Student & Technology Enthusiast
╚═══════════════════════╝

╔═ Socials ═══════════════╗
║ Mail      ⇒ officialmutairu@gmail.com
║ YouTube   ⇒ https://www.youtube.com/@spookystories5087
║ Instagram ⇒ https://www.instagram.com/wasberry4/
║ Blog      ⇒ https://gracioushope.substack.com
║ Website   ⇒ https://wasiu.tech
╚═══════════════════════╝

╔═ Debug ═══════════════╗
║ You can access the debug mode by adding #debug at the end of the URL and reloading.
║ Press [V] to toggle the free camera.
╚═══════════════════════╝

╔═ Three.js ════════════╗
║ Three.js is the library used to render this 3D world (release: ${THREE.REVISION})
║ https://threejs.org/
║ Created by mr.doob (https://x.com/mrdoob, https://github.com/mrdoob),
║ with contributions by Sunag (https://x.com/sea3dformat, https://github.com/sunag) who added TSL,
║ enabling the use of both WebGL and WebGPU.
╚═══════════════════════╝

╔═ Original Template ═══╗
║ This portfolio is built on the folio-2025 template by Bruno Simon, used under MIT License.
║ https://github.com/brunosimon/folio-2025
╚═══════════════════════╝

╔═ Musics ══════════════╗
║ The music was made for the original folio-2025 by Kounine (Linktree).
║ https://linktr.ee/Kounine
║ Released under CC0 license — do whatever you want with them!
╚═══════════════════════╝

╔═ Some more links ═════╗
║ Rapier (Physics library)  ⇒ https://rapier.rs/
║ Howler.js (Audio library) ⇒ https://howlerjs.com/
║ Amatic SC (Fonts)         ⇒ https://fonts.google.com/specimen/Amatic+SC
║ Nunito (Fonts)            ⇒ https://fonts.google.com/specimen/Nunito?query=Nunito
╚═══════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
