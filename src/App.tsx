import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Box, Button, Flex, Progress, Text } from '@chakra-ui/react'
import crateFile from 'crate/crate_bg.wasm?url'
import crate, { InitOutput, archive } from 'crate'
import { FileDrop } from 'react-file-drop'
import { BsCardImage } from 'react-icons/bs'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react'
import JSZip from 'jszip'

function App() {
  const wasm = useRef<InitOutput>()
  const worker = useRef<Worker>()
  const [fileList, setFilelist] = useState<FileList | null>(null)
  const [showFileDrop, setShowFileDrop] = useState(true)
  const [isLoading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    crate(crateFile).then((initOutput) => (wasm.current = initOutput))
    worker.current = new Worker(
      new URL('workers/zip-worker.ts', import.meta.url),
      { type: 'module' }
    )
    worker.current.postMessage({ type: 'init' })
  }, [])

  const handleFileDrop = (files: FileList | null) => {
    setFilelist(files)
    setTimeout(() => {
      setShowFileDrop(false)
    })
  }

  const handleCompress = async () => {
    if (!fileList) return
    const startTime = performance.now()
    setLoading(true)
    const files = Array.from(fileList)
    const fileNames = files.map(({ name }) => name)

    const promiseU8 = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer()
      return new Uint8Array(arrayBuffer)
    })

    const VecU8 = await Promise.all(promiseU8)

    const compressedFile = archive(VecU8, fileNames, (i: string) => {
      const percentage = (Number(i) + 1) / files.length
      setProgress(percentage * 100)
    })

    const blob = new Blob([compressedFile.buffer])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('download', `compressed-wasm-test.zip`)
    a.setAttribute('href', url)
    a.style.display = 'none'
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setLoading(false)
    const endTime = performance.now()
    console.log(
      `Archiving ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    )
  }

  const handleCompressWorker = () => {
    if (!fileList) return
    const startTime = performance.now()

    setLoading(true)
    const files = Array.from(fileList)
    if (worker.current) {
      worker.current.postMessage(files)
      function listener(e: MessageEvent<any>) {
        const type = e.data.type

        if (type === 'percentage') {
          const percentage = (Number(e.data) + 1) / files.length
          setProgress(percentage * 100)
          return
        }

        if (type === 'finish') {
          const U8: Uint8Array = e.data.data
          const blob = new Blob([U8.buffer])
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.setAttribute('download', `compressed-wasm-test.zip`)
          a.setAttribute('href', url)
          a.style.display = 'none'
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
          setLoading(false)
          const endTime = performance.now()
          console.log(
            `Archiving ${((endTime - startTime) / 1000).toFixed(2)} seconds`
          )
          if (worker.current)
            worker.current.removeEventListener('message', listener)
        }
      }
      worker.current.addEventListener('message', listener)
    }
  }

  const handleCompressJsZip = async () => {
    if (!fileList) return
    const startTime = performance.now()
    setLoading(true)
    const files = Array.from(fileList)

    const zip = new JSZip()

    const promises = files.map(async (file) => {
      const u8 = new Uint8Array(await file.arrayBuffer())
      zip.file(file.name, u8)
    })

    await Promise.all(promises)

    const zippedFiles = await zip.generateAsync({ type: 'blob' }, (e) => {
      setProgress(e.percent)
    })
    const url = URL.createObjectURL(zippedFiles)
    const a = document.createElement('a')
    a.setAttribute('download', `compressed-wasm-test.zip`)
    a.setAttribute('href', url)
    a.style.display = 'none'
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setLoading(false)
    const endTime = performance.now()
    console.log(
      `Archiving ${((endTime - startTime) / 1000).toFixed(2)} seconds`
    )
  }

  return (
    <>
      <Box p="8" display="flex" flexDir="column" gap="12" alignItems="center">
        {showFileDrop && (
          <FileDrop className="file-drop" onDrop={handleFileDrop}>
            <Flex
              justifyContent="center"
              alignItems="center"
              flexDir="column"
              height="100%"
            >
              <Box mb="2">
                <BsCardImage color="#000" size={64} />
              </Box>
              <Text mb="1" fontWeight="semibold">
                Drop Certificate Template Here!
              </Text>
              <Text fontSize="xs">Support only PNG Format</Text>
            </Flex>
          </FileDrop>
        )}
      </Box>
      <Box px="8">
        {fileList && (
          <TableContainer overflowY="auto" mb="20">
            <Table variant="simple">
              <Thead position="sticky" top="0" left="0" bg="white">
                <Tr>
                  <Th>Filename</Th>
                  <Th>format</Th>
                  <Th isNumeric>size</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Array.from(fileList ?? []).map((file) => (
                  <Tr key={file.name}>
                    <Td>{file.name}</Td>
                    <Td>{file.name.split('.')[1] ?? 'N/A'}</Td>
                    <Td isNumeric>{(file.size / 1024).toFixed(2)} kB</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
        {fileList && (
          <Flex
            boxShadow="lg"
            px="4"
            bg="white"
            position="fixed"
            bottom="0"
            height="16"
            left="0"
            right="0"
            alignItems="center"
            justifyContent="space-between"
          >
            <Progress value={progress} w="64" />
            <Flex alignItems="center" gap="3">
              <Button
                onClick={() => {
                  setFilelist(null)
                  setShowFileDrop(true)
                  setProgress(0)
                }}
              >
                Cancel
              </Button>
              <Button
                isLoading={isLoading}
                onClick={handleCompress}
                colorScheme="green"
              >
                Compress
              </Button>
              <Button
                isLoading={isLoading}
                onClick={handleCompressWorker}
                colorScheme="green"
              >
                Compress Worker
              </Button>
              <Button
                isLoading={isLoading}
                onClick={handleCompressJsZip}
                colorScheme="green"
              >
                Compress JSZIP
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </>
  )
}

export default App
