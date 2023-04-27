import crateFile from 'crate/crate_bg.wasm?url'
import crate, { archive } from 'crate'

self.addEventListener('message', async (e) => {
  const files: File[] = e.data

  const type = e.data.type

  if (type === 'init') {
    await crate(crateFile)
    console.log('Initialization finish')
    return
  }

  const fileNames = files.map(({ name }) => name)

  const promiseU8 = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  })

  const VecU8 = await Promise.all(promiseU8)

  const compressedFile = archive(VecU8, fileNames, (i: number) => {
    self.postMessage({ type: 'percentage', data: i })
  })

  self.postMessage({ type: 'finish', data: compressedFile })
})
