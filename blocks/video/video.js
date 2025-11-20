/* global bc */

import { FranklinBlock, createOptimizedPicture, loadScriptCustom, generateGifComponent, generateSharepointServedVideo } from '../../scripts/lib-franklin.js';

export default class Video extends FranklinBlock {
  constructor(blockName, block, config) {
    super(blockName, block, config);
    this.playerId = 'g2OtgoAoBs';
    this.defaultImage = '/assets/video.png';
    this.playerSrc = (accountId) => `https://players.brightcove.net/${accountId}/${this.playerId}_default/index.min.js`;
    this.getValue = (key) => (parent) => [...parent.children].find((ch) => ch.firstElementChild?.innerText.trim() === key)?.children[1];
  }

  variants = [
    {
      name: 'gif',
      test: this.findSectionContent('gif'),
    },
    {
      name: 'local_served_video',
      test: this.findSectionContent('local_video'),
    },
    {
      name: 'no-poster',
      test: !this.block.querySelector('picture'),
    },
    {
      name: 'default',
      test: this.block.querySelector('playerId'),
    },
  ];

  /**
   * Reads the video data from the block
   */
  readVideoData() {
    return this.block.children.length > 0
      ? [...this.block.children].reduce((data, div) => {
          if (div.children.length === 2) {
            const posterWebp = div.children[1].querySelector('picture source');
            const dataSrc = posterWebp?.srcset || undefined;
            const imgTarget = div.children[1].querySelector('img');
            const imgSrc = imgTarget?.src || undefined;
            data[div.children[0].innerText.trim().toLowerCase()] = dataSrc || imgSrc || div.children[1].innerText.trim();
          }
          return data;
        }, {})
      : {};
  }

  beforeBlockDataRead() {
    const gifImage = this.findSectionContent('gif');
    const localVideo = this.findSectionContent('local_video');

    if (gifImage) {
      gifImage.classList.add('video-gif-image');
      gifImage.querySelector('picture')?.classList.add('video-gif-image');
    } else {
      delete this.schema?.schema?.gif_image;
    }

    if (localVideo) {
      localVideo.classList.add('local-video');
    } else {
      delete this.schema?.schema?.localVideo;
    }

    if (this.variant === 'no-poster') {
      delete this.schema.schema?.poster;
      delete this.schema.schema?.posterImg;
    }
  }

  beforeBlockRender() {
    const isVideo = this.variant !== 'gif';

    const videoData = this.readVideoData(this.block);
    this.inputData = { ...videoData, player_id: this.playerId, ...this.inputData, isVideo };

    this.inputData = {
      ...this.inputData,
      [this.variant]: { ...this.inputData },
    };

    if (this.inputData.autoplay?.toLowerCase() !== 'true') {
      delete this.inputData.autoplay;
    }

    if (this.inputData.loop?.toLowerCase() !== 'true') {
      delete this.inputData.loop;
    }

    if ((!this.inputData.video_id || !this.inputData.account_id) && (this.variant === 'no-poster' || this.variant === 'default')) {
      const err = 'Missing video data, video_id and account_id are required!';
      this.inputData.error = err;
      console.error(err);
    }
    if (!this.inputData.poster) {
      if (!this.inputData.posterImg) {
        this.inputData.posterImg = this.defaultImage;
      }
      const picture = createOptimizedPicture(this.inputData.posterImg);
      this.inputData.poster = picture.outerHTML;
    }
    if (this.inputData.video_id && this.inputData.account_id) {
      this.playerSrc();
    }
    return this.inputData;
  }

  afterBlockRender = () => {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    const isEditorialWidth = this.block.classList.contains('editorial-width') || this.block.classList.contains('inline');
    if (isEditorialWidth) {
      this.block.classList.add('block-padding-desktop-x-190');
    }

    if (this.variant === 'gif') {
      const parentElementForVideo = this.block.querySelector('.video-container');
      parentElementForVideo.innerHTML = '';
      generateGifComponent(this.inputData?.gif?.gif, this.inputData?.gif_static_image, parentElementForVideo);
      // Video.addClassesToManageGutters();

      return true;
    }

    if (this.variant === 'local_served_video') {
      const parentElementForVideo = this.block.querySelector('.video-container');
      parentElementForVideo.innerHTML = '';
      generateSharepointServedVideo(this.inputData?.local_served_video?.local_video, parentElementForVideo, false, this.inputData.autoplay, this.inputData.loop);
      // Video.addClassesToManageGutters();

      return true;
    }

    if (this.inputData.video_id && this.inputData.account_id) {
      const timeout = this.inputData.load?.toLowerCase() === 'fast' ? 0 : 3000;

      return setTimeout(async () => {
        await loadScriptCustom(this.playerSrc(this.inputData.account_id));
        const videoEl = this.block.querySelector(`video-js`);
        const player = bc(videoEl);
        const video = videoEl.querySelector('video');
        const addLoadedClass = () => {
          videoEl.closest('.video-container')?.classList.add('loaded');
        };
        player.ready(() => {
          if (video.readyState > 0) {
            addLoadedClass();
          } else {
            player.on('loadedmetadata', addLoadedClass);
          }
        });

        player.on('play', () => {
          const videos = document.querySelectorAll('video');
          videos.forEach((vid) => {
            if (vid !== video) {
              vid.pause();
            }
          });
        });

        // Video.addClassesToManageGutters();
      }, timeout);
    }

    return true;
  };

  // static addClassesToManageGutters = () => {
  //   const inlineVideos = document.querySelectorAll('.core-video:not(.left):not(.right)');

  //   inlineVideos.forEach((videoInline) => {
  //     videoInline.classList.add('no-gutter-block');
  //   });
  // };
}
