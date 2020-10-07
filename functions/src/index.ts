import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as request from 'request';

admin.initializeApp();
const app = express();
const db = admin.firestore();

const buildPreviewForSEO = 
  (id: string, title: string, description: string, url: string, bUrl: string, image: string, pName: string) => {
  const httpImage = image.replace('https:', 'http:');
  return `
  <!DOCTYPE html>
    <head>
      <title>Holonotes</title>

      <!-- Primary Meta Tags -->
      <meta name="title" content="${title}">
      <meta name="description" content="${description}">

      <meta property="og:url" content="${url}" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${httpImage}" />
      <meta property="og:image:secure_url" content="${image}" />
      <meta property="fb:app_id" content="2038668203062140" />

      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${image}">
      <meta property="twitter:url" content="${bUrl}">

    </head>
    <body>
      <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "Organization",
          "name": "Holonotes",
          "url": "https://holonotes.io",
          "address": "",
          "sameAs": [
            "https://www.facebook.com/holonotes",
            "https://twitter.com/holonotes",
            "https://www.instagram.com/holonotes_music"
          ]
        }
      </script>
      <script>window.location="https://holonotes.io/${pName}/${id}"</script>
    </body>
  </html>`;
};

// Proxing for youtube thumbnail
const youtubeThumbnailURL = 'https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=';

app.get('/ut-thumbnail', (req, res) => request({
  url: youtubeThumbnailURL + req.query.id,
  method: req.query.method
}).on('error', error => {
  res.status(502).send(error.message);
}).pipe(res));

// Proxing for youtube search
const youtubeSearchURL = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&key=AIzaSyC-TQ6ZQMcYeWwHnjD7-BOXtf_XpR6lYDY&q=';

app.get('/ut-search', (req, res) => {
  const proxy = request({
    url: encodeURI(youtubeSearchURL + req.query.q),
    method: req.query.method
  });

  proxy.on('response', proxyResponse => {
    // console.log(proxyResponse);
  }).pipe(res);

  proxy.on('error', error => {
    console.error(error);
    res.status(502).send(error.message);
  });
});

// Proxing for news feeds urls
const holonotesUrl = 'https://holonotes.io'
app.get('/n-feed', (req: any, res) => request({
  url: req.query.id.match(/(rss|news|feed)/) ? req.query.id : holonotesUrl,
  method: req.query.method
}).on('error', error => {
  res.status(502).send(error.message);
}).pipe(res));

exports.app = functions.https.onRequest(app);

exports.projectPreviewSEO = functions.https.onRequest((req, res) => {
  const path = req.path;
  const id = path.replace(/^\/project\/(.+)/, '$1').split('/')[0];
  const MIN_ID_LENGTH = 4;
  const query: any = req.query;
  const bUrl = 'https://holonotes.io';
  const pName = 'project';
  const suffix = 'preview';
  const url = `${bUrl}/${pName}/${id}/${suffix}`;
  let title: string, description: string, image: string;
  let html = '';

  if (id && id.length >= MIN_ID_LENGTH && !query.v) {
    const docRef = db.doc(`projects/${id}`);

    docRef.get().then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        title = data.name;
        description = data.preview_description;
        image = data.cover_img;
        html = buildPreviewForSEO(id, title, description, url, bUrl, image, pName);
      }
      res.send(html);
    }).catch((error) => {
      console.error(error);
      html = buildPreviewForSEO('', '', '', '', '', '', '');
      res.send(html);
    });
  } else {
    const vid = query && query.v ? query.v : ''
    title = query && query.t ? query.t : ''
    description = query && query.d ? query.d : '';
    title = title.replace(/_/g, ' ');
    description = description.replace(/_/g, ' ');
    // keeping vid param for backward competability
    image = vid.startsWith('http') ? vid : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    html = buildPreviewForSEO(id, title, description, url, bUrl, image, pName);
    res.send(html);
  }
});

exports.challengesPreviewSEO = functions.https.onRequest((req, res) => {
  const path = req.path;
  const id = path.replace(/^\/challenges\/(.+)/, '$1').split('/')[0];
  const MIN_ID_LENGTH = 4;
  const query = req.query;
  const bUrl = 'https://holonotes.io';
  const pName = 'challenges';
  const suffix = 'preview';
  let url = `${bUrl}/${pName}/${id}/${suffix}`;
  let title: any = ''
  let description: any = '';
  let html = '';
  let image: any = query && query.v ? query.v : ''
  title = query && query.t ? query.t : ''
  description = query && query.d ? query.d : '';
  title = title.replace(/_/g, ' ');
  description = description.replace(/_/g, ' ');

  if (id && id.length >= MIN_ID_LENGTH && !query.v) {
    const docRef = db.doc(`shared_challenges/${id}`);

    docRef.get().then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const challenge = data.challenge;
        title = challenge && challenge.name ? challenge.name : data.name;
        description = challenge && challenge.description ? challenge.description.join(' ') : '';
        
        image = 'https://holonotes.io/assets/imgs/your-own-challenge.jpg';
        if (challenge.id === 'learn_song') {
          const defImgUrl = 'https://holonotes.io/assets/imgs/learn-a-song-min.jpg';
          title += challenge.project && challenge.project.artist ? ` by ${challenge.project.artist}` : '';
          image = challenge.project && challenge.project.imgUrl ? challenge.project.imgUrl : defImgUrl;
        } else if (challenge.id === 'new_song_each_time') {
          const img = 'https://holonotes.io/assets/imgs/learn-a-song-every-week-min.jpg';
          const wg = challenge.week_goal;
          let cImg = null;
          if (wg && wg.length > 0) {
            cImg = wg[wg.length - 1].image;
            const txt = wg[wg.length - 1].text ? wg[wg.length - 1].text.replace(/\s/g, '') : null;
            if (txt) {
              url += `/${txt}`;
            }
          }
          image = cImg || img;
        }
        
        html = buildPreviewForSEO(id, title, description, url, bUrl, image, pName);
      }
      res.send(html);
    }).catch((error) => {
      console.error(error);
      html = buildPreviewForSEO('', '', '', '', '', '', '');
      res.send(html);
    });
  } else {
    html = buildPreviewForSEO(id, title, description, url, bUrl, image, pName);
    res.send(html);
  }
});

exports.aggregateSharedChallenges = functions.firestore
  .document('shared_challenges_counters/{uid_pid}').onCreate( async (snapshot, context) => {

    const data = snapshot.data();
    const id = data.shared_id;

    if (!id || id === undefined || id === null) {
      return null;
    }
    
    const docRef = db.doc(`shared_challenges/${id}`);
    const docSnap = await docRef.get();
    let total = 0;
    if (docSnap.exists) {
      const docData = docSnap.data();
      const stats = docData.challenge.stats;
      if (stats) {
        total = stats.participants || 0;
      }
    }

    const next = {
      challenge: {
        stats: {
          participants: total + 1
        }
      }
    }

    return docRef.set(next, { merge: true });
  });

  // exports.addBetaTester = functions.firestore
  // .document('users/{uid}').onCreate( (snapshot, context) => {

  //   const betaTestersList = [
  //     'lgm@nemesis.co.il',
  //     'moshe@nemesis.co.il',
  //     'test@nemesis.co.il',
  //     'lior182@gmail.com'
  //   ];

  //   const user = snapshot.data();
  //   const id = user.user_id;
  //   const email = user.email;

  //   if (!user || user === undefined || user === null) {
  //     return null;
  //   }
    
  //   let found = false;
  //   betaTestersList.forEach(tester => {
  //     if (tester === email) {
  //       found = true;
  //     }
  //   });
  //   if (!found) {
  //     return null;
  //   }
  //   const data = {roles: {betaTester: true}};
  //   const userRef = db.doc(`users/${id}`);
  //   return userRef.update(data);
  // });