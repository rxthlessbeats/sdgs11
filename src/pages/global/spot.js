import BackKey from '../global/backkey';
import Load from '../global/load';
import Invalid from './invalid';
import { useParams } from "react-router-dom";
import React, { useEffect, useState, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import './spot.css'

function SpotPage() {
	const { spotID } = useParams();
	const { from } = useParams();
	const [loading, setLoading] = useState(true);
	const [valid, setValid] = useState(true);
	const [spot, setSpot] = useState({lat: 0, lng: 0});
	const [userLat, setUserLat] = useState(0);
	const [userLng, setUserLng] = useState(0);
	const [truncateText, setTruncateText] = useState('');
	const [text, setText] = useState('');
	const [truncate, setTruncate] = useState(true);
	const [img, setImg] = useState();
	const { isLoaded } = useJsApiLoader({
		id: 'google-map-script',
		googleMapsApiKey: "AIzaSyAWGySAUlZ2lcu2S9zt5B852RD6ghn3th8",
	})

	const setFinished = useCallback(async () => {
		console.log("Set Finished");
		if(!localStorage.getItem('token')){
			console.log("User Not Logged In, No Need to Set Finished");
			return;
		}
		// fetch API for finished Spots
		const response = await fetch('https://sdgs12.herokuapp.com/api/spotFinished', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-access-token': localStorage.getItem('token')
			},
			body: JSON.stringify({
				spotID,
			}),
		});
		const data = await response.json();
		if(data.status === 'fail') {
			console.log("Failed to Set Finished");
            return;
		}
		console.log(data);
		setSpot(prev => ({
            ...prev,
            finished: data.finishedData ? true : false
        }));
	}, [spotID])

	const getSpot = useCallback(async () => {
		// Part I: Get Path
        const response = await fetch('https://sdgs12.herokuapp.com/api/spot', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				spotID,
			}),
        })
		const data = await response.json();
		if(data.status === 'fail'){
			setValid(false);
			console.log("Failed to Get Spot");
			return;
		}
		setText(data.spotData.description.split('\\n').map(
			(str, id) => {
				if(id === 0) return <p key={id}>&emsp;&emsp;{str}</p>
				else return <p key={id}><br/><br/>&emsp;&emsp;{str}</p>
			}
		));
		if(data.spotData.description.substring(0, 140).includes('\\n')) {
			if(data.spotData.description.substring(0, 140).split('\\n')[0].length > 120) {
				setTruncateText(<p>&emsp;&emsp;{data.spotData.description.substring(0, 140).split('\\n')[0]}</p>);
			} else {
				setTruncateText(data.spotData.description.substring(0, 120).split('\\n').map(
					(str, id) => {
						if(id === 0) return <p key={id}>&emsp;&emsp;{str}</p>
						else return <p key={id}><br/><br/>&emsp;&emsp;{str}</p>
					}
				))
			}
		} else {
			console.log(3);
			setTruncateText(data.spotData.description.substring(0, 135).split('\\n').map(
				(str, id) => {
					if(id === 0) return <p key={id}>&emsp;&emsp;{str}</p>
					else return <p key={id}><br/><br/>&emsp;&emsp;{str}</p>
				}
			));
		}
		setSpot(data.spotData);
		try {
			setImg(require('../../images/spot/'+data.spotData.name+'.jpg'));
		} catch (err) {
			setImg(require('../../images/spot/image-not-found.jpg'));
		}

		await setFinished();
		setLoading(false);
    }, [spotID, setFinished]);

	useEffect(() => {
        getSpot();
    }, [getSpot]);

	function distance(lat1, lon1, lat2, lon2) {
		var p = 0.017453292519943295;    // Math.PI / 180
		var c = Math.cos;
		var a = 0.5 - c((lat2 - lat1) * p)/2 + 
				c(lat1 * p) * c(lat2 * p) * 
				(1 - c((lon2 - lon1) * p))/2;
		return 12742 * Math.asin(Math.sqrt(a)) * 1000; // 2 * R; R = 6371 km
	}

	useEffect(() => {
		if(userLat === 0) return;
		setSpot(prev => ({
			...prev,
			distance: distance(userLat, userLng, spot.lat, spot.lng)
		}));
    }, [userLat, userLng, spot.lat, spot.lng]);

	
	const getUserLatLng = useCallback(() => {
		// Dummy Fetch
		navigator.geolocation.getCurrentPosition(()=>{}, ()=>{}, {});
		const success = (position) => {
			setUserLat(position.coords.latitude);
			setUserLng(position.coords.longitude);
		}
		const fail = () => {};
		navigator.geolocation.getCurrentPosition(
			success, fail, {
				enableHighAccuracy: true, 
				timeout:10000
			}
		);
	}, [])

	useEffect (() => {
		let interval;
		getUserLatLng();
		interval = setInterval(getUserLatLng, 1000);
		return () => clearInterval(interval);
	}, [getUserLatLng])

	async function claim(){
		console.log("Claim: " + spotID);
		if(!localStorage.getItem('token')){
			console.log("User Not Logged In, Redirect to Auth");
			alert("Login before claiming");
			window.location.href = '/login';
			return;
		}
		// fetch API to post a new spot
		const response = await fetch('https://sdgs12.herokuapp.com/api/claim', {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				'x-access-token': localStorage.getItem('token')
			},
			body: JSON.stringify({
				spotID: spotID,
			}),
        })
		const data = await response.json();
		if(data.status === 'fail'){
			console.log("Failed to Claim");
			return;
		}
		setSpot(prev => ({
            ...prev,
            finished: true
        }));
	}

	// disappearable shadow
	const [active, setActive] = useState(false);
	useEffect(() => {
		if(typeof(window) === 'undefined') return;
		window.addEventListener('scroll', pop);
		
		return () => window.removeEventListener('scroll', pop);
	},[]);

	const pop = () => {
		if(typeof(window) === 'undefined') return;
		if (window.scrollY > 0) {
			setActive(true);
		}        
		if (window.scrollY === 0) {
			setActive(false);
		}
	}

	if(loading || !isLoaded) return <Load/>;
	if(!valid) return <Invalid/>
	return (
		<div className='SpotPage'>
			<>
				<div className={active? 'header header-shadow': 'header'}>
                	<h1>建築介紹</h1>
            	</div>
				<BackKey from={from}/>
				<div className='container'>
					<img src={img} alt="圖片"></img>
				</div>
				<div className='title'>
					<h1>{spot.name}</h1>
					<h2>距離: {
						spot.distance === '?' ? 
						'?'
						: 
						<>{spot.distance >= 1000 ?
							<>{Math.round(spot.distance/100)/10}公里</> 
							:
							<>{Math.round(spot.distance)}公尺</>}
						</>}
					</h2>
					{/* <img src={require('../../images/sdgsIcon/4.png')} alt="SDGS icon"></img>  */}
				</div>
				<div className='description'>
					{spot.description && spot.description.length>140?
						(<>{truncate? 
							<>{truncateText}<p>...</p><button onClick={() => {setTruncate(false)}}>顯示更多</button></> 
							: 
							<>{text}<button onClick={() => {setTruncate(true)}}>顯示較少</button></>
						}</>) 
						:
						<>{text}</>
					}
				</div>
				{spot.finished?
					<button className='claim'>已領取</button>
					:
					<>{spot.distance <= 50? 
						<button className='claim active' onClick={() => {claim(spot.spotID)}}>領取地點</button> 
						:
						<button className='claim inactive'>再靠近一點點</button> 
					}</>
				}
			</>
		</div>
	)
}

export default SpotPage