import React, { Component } from 'react';
import TranscribeService from 'aws-sdk/clients/transcribeservice';
import Storage from '@aws-amplify/storage';
import { Card, StyledBody } from 'baseui/card';
import { Auth } from 'aws-amplify';
import get from 'lodash.get';
import { Spinner } from 'baseui/spinner';
import { FileUploader } from 'baseui/file-uploader';
import config from '../../../aws-exports';
import styles from './Transcribe.module.scss';
import { Block } from 'baseui/block';
import TranscriptEditor from '@bbc/react-transcript-editor';

class Transcribe extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inProgress: false,
      mediaUrl: '',
      transcribedJsonOutput: '',
      progressAmount: 0
    };
  }

  handleDrop = acceptedFiles => {
    this.setState({ inProgress: true });
    Storage.put(`transcribe/${acceptedFiles[0].name}`, acceptedFiles[0], {
      contentType: acceptedFiles[0].type
    })
      .then(result => {
        console.log(result);
        const url = `https://${config.aws_user_files_s3_bucket}.s3.amazonaws.com/public/${result.key}`;
        console.log(url);
        this.setState({ mediaUrl: url });
        this.transcribe(url);
      })
      .catch(err => {
        console.log(err);
      });
  };

  fetchTranscribeData = async url => {
    const baseUrl = `https://apifeeds.kqed.org/feeds/transcribe`;
    let response = await fetch(baseUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: url
    });
    response = await response.text();

    this.setState({
      transcribedJsonOutput: JSON.parse(JSON.parse(response)),
      inProgress: false
    });
  };

  transcribe = async url => {
    let transcribeJob, transcribeJobResponse;
    const data = await Auth.currentUserCredentials();
    let transcribeservice = new TranscribeService({
      apiVersion: '2017-10-26',
      region: 'us-east-1',
      credentials: data
    });
    let params = {
      LanguageCode: 'en-US',
      Media: {
        MediaFileUri: url
      },
      TranscriptionJobName: Math.random()
        .toString(36)
        .substr(2, 9),
      MediaFormat: 'mp3',
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 6
      }
    };

    try {
      transcribeJob = await transcribeservice
        .startTranscriptionJob(params)
        .promise();
    } catch (e) {
      console.error(e);
    }

    //check wheather transcriprion job in done
    //This can also be done by socket, but considering scope of this application, its fine
    let TranscriptionJobName = get(
      transcribeJob,
      'TranscriptionJob.TranscriptionJobName'
    );
    try {
      let transcribeStatusInterval = setInterval(async () => {
        transcribeJobResponse = await transcribeservice
          .getTranscriptionJob({
            TranscriptionJobName: TranscriptionJobName /* required */
          })
          .promise();

        const status = get(
          transcribeJobResponse,
          'TranscriptionJob.TranscriptionJobStatus'
        );
        if (status === 'COMPLETED') {
          clearInterval(transcribeStatusInterval);
          const fileUrl = get(
            transcribeJobResponse,
            'TranscriptionJob.Transcript.TranscriptFileUri'
          );
          this.fetchTranscribeData(fileUrl);
        }
      }, 5000);
    } catch (e) {}
  };
  render() {
    const { inProgress, mediaUrl, transcribedJsonOutput } = this.state;
    console.log(this.state);
    return (
      <div className={styles.transcribe}>
        <div className={styles.transcribe_Container}>
          {inProgress ? (
            <Card className={styles.transcribe_Spinner}>
              <StyledBody>
                <Spinner size={96} />
                <Block
                  as="h2"
                  font="font500"
                  overrides={{
                    Block: {
                      style: { color: 'red' }
                    }
                  }}
                >
                  <div>
                    Please Wait, It takes around 5 minutes to Transcribe 10
                    minutes of audio
                  </div>
                  <div>Please do not refresh this page</div>
                </Block>
              </StyledBody>
            </Card>
          ) : (
            <FileUploader
              onCancel={this.reset}
              onDrop={this.handleDrop}
              progressAmount={this.state.progressAmount}
              progressMessage={
                this.state.progressAmount &&
                `Uploading... ${this.state.progressAmount}% of 100%`
              }
              overrides={{
                FileDragAndDrop: {
                  style: props => ({
                    borderColor: props.$isDragActive
                      ? props.$theme.colors.positive
                      : props.$theme.colors.warning
                  })
                },
                ContentMessage: {
                  style: props => ({
                    color: props.$theme.colors.warning
                  })
                },
                ContentSeparator: {
                  style: props => ({
                    color: props.$theme.colors.warning
                  })
                }
              }}
            />
          )}
          {mediaUrl && transcribedJsonOutput && (
            <div className={styles.transcribe_Editor}>
              <TranscriptEditor
                transcriptData={transcribedJsonOutput}
                mediaUrl={mediaUrl}
                isEditable={true}
                spellCheck={false}
                sttJsonType={'amazontranscribe'}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Transcribe;
