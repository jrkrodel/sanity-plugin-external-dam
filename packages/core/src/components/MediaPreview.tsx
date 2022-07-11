import { blue } from '@sanity/color'
import { PlayIcon } from '@sanity/icons'
import { Box, Card, Spinner } from '@sanity/ui'
import React from 'react'
import sanityClient, { imageBuilder } from '../scripts/sanityClient'
import { MediaFile, SanityUpload } from '../types'
import AudioIcon from './AudioIcon'
import FileMetadata from './FileMetadata'
import VideoIcon from './VideoIcon'
import WaveformDisplay from './WaveformDisplay'

export interface MediaPreview {
  file: MediaFile
  context: 'browser' | 'input' | 'detailsDialog'
}

const Player: React.FC<SanityUpload> = (props) => {
  if (!props.fileURL) {
    return null
  }
  if (props.contentType?.includes('audio')) {
    return (
      <audio
        src={props.fileURL}
        controls={true}
        autoPlay={true}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    )
  }
  else if(props.contentType?.includes('pdf')) {
    return (
      <iframe
      src={props.fileURL}
      width='100%'
      height='100%'>
      </iframe>
    )
  }
  else return (
    <video
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
      src={props.fileURL}
      controls={true}
      autoPlay={true}
    />
  )
}

const WrappingCard: React.FC<
  Pick<MediaPreview, 'context'> & {
    paddingBottom?: string
  }
> = ({
  children,
  context,
  // 16:9 aspect ratio
  paddingBottom = '56.25%',
}) => {
  return (
    <Card
      padding={context === 'input' ? 4 : 0}
      border={context === 'input'}
      display="flex"
      style={{
        textAlign: 'center',
        width: '100%',
        position: 'relative',
        paddingBottom,
      }}
      sizing="border"
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </Card>
  )
}

const MediaPreview: React.FC<MediaPreview> = (props) => {
  const [playing, setPlaying] = React.useState(false)
  const [fullFile, setFullFile] = React.useState<SanityUpload>()

  const expandReference = React.useCallback(async (_ref) => {
    const doc = await sanityClient.fetch<SanityUpload>(`*[_id == $id][0]`, {
      id: _ref,
    })
    setFullFile(doc)
  }, [])

  React.useEffect(() => {
    if ((props.file as SanityUpload)?.fileURL) {
      setFullFile(props.file as SanityUpload)
    } else if (props.file && 'asset' in props.file && props.file?.asset?._ref) {
      expandReference(props.file.asset._ref)
    }
  }, [props.file])

  if (!props.file || (fullFile && !fullFile.fileURL)) {
    return null
  }

  if (!fullFile) {
    return (
      <WrappingCard context={props.context}>
        <Box
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
          }}
        >
          <Spinner />
        </Box>
      </WrappingCard>
    )
  }

  const imgUrl =
    fullFile.screenshot &&
    imageBuilder
      .image(fullFile.screenshot)
      .width(props.context === 'browser' ? 300 : 600)
      .url()

  let mediaType = null

  if(fullFile.contentType?.includes('audio')) {
    mediaType = 'audio'
  } else if(fullFile.contentType?.includes('video')) {
    mediaType = 'video'
  } else if(fullFile.contentType?.includes('pdf')) {
    mediaType = 'pdf'
  }

  const allowPlayback = props.context !== 'browser'

  if(mediaType != 'pdf') { 
    return (
      <WrappingCard
        context={props.context}
        paddingBottom={
          fullFile.dimensions
            ? `${(fullFile.dimensions.height / fullFile.dimensions.width) * 100}%`
            : undefined
        }
      >
        {playing ? (
          <Player {...fullFile} />
        ) : (
          <>
            {imgUrl ? (
              <img
                style={{
                  width: '100%',
                  borderRadius: '.3rem',
                  height: '100%',
                  objectFit: 'contain',
                  color: 'transparent',
                }}
                src={imgUrl}
                alt={`Video's thumbnail`}
              />
            ) : (
              <Card
                padding={0}
                sizing="border"
                style={{
                  position: 'relative',
                  height: '100%',
                }}
                tone="primary"
              >
                <Box
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%,-50%)',
                    color: blue[800].hex,
                    height: mediaType === 'audio' && '60%',
                    width: mediaType === 'audio' && '90%',
                  }}
                >
                  {mediaType === 'audio' ? (
                    <>
                      <AudioIcon
                        style={{
                          width: '50%',
                          maxHeight: '70%',
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%,-50%)',
                          zIndex: 0,
                          color:
                            fullFile && 'waveformData' in fullFile
                              ? blue[100].hex
                              : blue[800].hex,
                        }}
                      />
                      {fullFile.waveformData && (
                        <WaveformDisplay
                          waveformData={fullFile.waveformData}
                          style={{
                            zIndex: 1,
                            position: 'relative',
                            height: '100%',
                          }}
                          colorHue="blue"
                        />
                      )}
                    </>
                  ) : (
                    <VideoIcon style={{ width: '50%', maxHeight: '70%' }} />
                  )}
                </Box>
              </Card>
            )}
            {allowPlayback && (
              <button
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontSize: '3rem',
                  width: '1.5em',
                  height: '1.5em',
                  display: 'flex',
                  borderRadius: '50%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'white',
                  border: '1px solid #ced2d9',
                  boxShadow: '1px 1px 6px rgba(134,144,160,0.2)',
                  cursor: 'pointer',
                }}
                onClick={() => setPlaying(true)}
                aria-label={`Play ${mediaType}`}
              >
                <PlayIcon />
              </button>
            )}
            {props.context === 'input' && (
              <Card
                padding={4}
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <FileMetadata file={fullFile} />
              </Card>
            )}
          </>
        )}
      </WrappingCard>
    )
  } else {
    return (
      <WrappingCard
      context={props.context}
      paddingBottom={
        fullFile.dimensions
          ? `${(fullFile.dimensions.height / fullFile.dimensions.width) * 100}%`
          : undefined}
        > 
        {
          allowPlayback ? (
            <Player {...fullFile} />
            ) : <h1 style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                margin: '0',
                transform: 'translate(-50%,-50%)'
            }}>PDF</h1>
        }
      </WrappingCard>
    )
  }
}

export default MediaPreview
