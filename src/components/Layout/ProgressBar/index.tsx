'use client'
import Router from 'next/router';
import ProgressBar from '@badrap/bar-of-progress';

const progress = new ProgressBar({
  size: 2,
  color: '#38bdf8',
  className: 'bar-of-progress',
  delay: 100,
});

Router.events.on('routeChangeStart', () => progress.start());
Router.events.on('routeChangeComplete', () => progress.finish());
Router.events.on('routeChangeError', () => progress.finish());

const Progress = () => {
  return (<></>
  )
}

export default Progress
