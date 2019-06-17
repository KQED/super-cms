import React, { Component } from 'react';
import { FileUploader } from 'baseui/file-uploader';
import Storage from '@aws-amplify/storage';
import { FormControl } from 'baseui/form-control';
import styles from './Home.module.scss';
import { Button } from 'baseui/button';
import { StatefulSelect } from 'baseui/select';

class Home extends Component {
  state = { progressAmount: 0 };

  handleDrop = acceptedFiles => {
    this.setState({ fileToUpload: acceptedFiles[0] });
  };

  // startProgress method is only illustrative. Use the progress info returned
  // from your upload endpoint. If unavailable, do not provide a progressAmount.
  startProgress = () => {
    this.intervalId = setInterval(() => {
      if (this.state.progressAmount >= 100) {
        this.reset();
      } else {
        this.setState({ progressAmount: this.state.progressAmount + 10 });
      }
    }, 500);
  };

  save = () => {
    const { fileToUpload } = this.state;
    const bucketKey = this.state.value[0].id;
    console.log(this.state);
    Storage.put(`${bucketKey}/${fileToUpload.name}`, fileToUpload, {
      contentType: fileToUpload.type
    })
      .then(result => {
        console.log(result);
        this.reset();
      })
      .catch(err => {});
    // handle file upload...
    this.startProgress();
  };

  // reset the component to its original state. use this to cancel the upload.
  reset = () => {
    clearInterval(this.intervalId);
    this.setState({ progressAmount: 0 });
  };

  render() {
    const { progressAmount } = this.state;
    return (
      <div className={styles.home}>
        <div className={styles.home_Container}>
          <FormControl>
            <StatefulSelect
              options={[
                { name: 'The Bay', id: 'the-bay' },
                { name: 'Bay Curious', id: 'bay-curios' },
                { name: 'The Cooler', id: 'the-cooler' },
                { name: 'Forum', id: 'forum' }
              ]}
              labelKey="name"
              valueKey="id"
              onChange={({ value }) => this.setState({ value })}
              value={this.state.value}
            />
          </FormControl>
          <FormControl>
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
          </FormControl>
          <FormControl>
            <Button onClick={this.save} isLoading={progressAmount > 0}>
              Save
            </Button>
          </FormControl>
        </div>
      </div>
    );
  }
}

export default Home;
