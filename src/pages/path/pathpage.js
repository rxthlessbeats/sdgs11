import './pathpage.css';
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from "react-router-dom";

function PathPage() {
	const navigate = useNavigate();
	const [userX, setUserX] = useState(0);
    const [userY, setUserY] = useState(0);
	const [predictTime, setPredictTime] = useState(0);
	const [spotList, setSpotList] = useState([
		// {spotID: 1, x: 50, y: 150, name: "人社院", description: "人社院是迷宮", distance: 0},
		// {spotID: 2, x: 70, y: 60, name: "台達館", description: "資工電神所在地", distance: 0},
		// {spotID: 3, x: 80, y: 90, name: "小吃部", description: "小吃部只有麥當勞", distance: 0}, 
		// {spotID: 4, x: 10, y: 10, name: "成功湖", description: "很大的一個湖", distance: 0},
		// {spotID: 5, x: 20, y: 130, name: "教育館", description: "上通識課的地方", distance: 0},  
        // {spotID: 6, x: 100, y: 100, name: "旺宏館", description: "這是旺宏館", distance: 0}, 
        // {spotID: 7, x: 60, y: 100, name: "生科院", description: "叉叉!", distance: 0}, 
        // {spotID: 8, x: 120, y: 120, name: "葉子", description: "就是個葉子", distance: 0},
    ]);

	const pathID = localStorage.getItem('pathID');
	const [pathName, setPathName] = useState('');
	const [pathFinished, setPathFinished] = useState(false);
	
	const setFinished = useCallback(async () => {
		console.log("Set Finished");
		if(!localStorage.getItem('token')){
			console.log("User Not Logged In, No Need to Set Finished");
			return;
		}
		// fetch API for finished Spots
		const response = await fetch('https://sdgs12.herokuapp.com/api/finished', {
			method: 'GET',
			headers: {
				'x-access-token': localStorage.getItem('token')
			}
		});
		const data = await response.json();
		if(data.status === 'fail') {
			console.log("Failed to Set Finished");
            return;
		}
		const finishedData = data.finishedData; // all the spots you visited
		var finishedSpots = [];
		for(var i in finishedData) finishedSpots.push(finishedData[i].spotID);
		console.log(finishedSpots);
		setSpotList(spotList => spotList.map((spot) => {
			if(finishedSpots.includes(spot.spotID)){
				console.log("Set Finished === True for " + spot.name);
				return {...spot, finished: true};
			}
			else return {...spot, finished: false};
		}))
	}, [])

	const getPath = useCallback(async () => {
		// Part I: Get Path
        const response = await fetch('https://sdgs12.herokuapp.com/api/path', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				pathID,
			}),
        })
		const data = await response.json();
		if(data.status === 'fail'){
			console.log("Failed to Get Path");
			return;
		}

		const pathData = data.pathData;
		console.log(pathData);
		setPathName(pathData.name);

		const spotPath = data.spotPath;
		console.log(spotPath);

		// Part II: Get Spots
		var spotIDList = [];
		for(var i in spotPath){
            spotIDList.push(spotPath[i].spotID);
        };
		console.log(spotIDList);

		const response2 = await fetch('https://sdgs12.herokuapp.com/api/spot', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				spotIDList,
			}),
		})
		const data2 = await response2.json();
		if(data2.status === 'fail'){
			console.log("Failed to Get Spots");
			return;
		}
		const spotData = data2.spotData;
		console.log("SpotData: " + spotData);
		setSpotList(spotData);
		setUserX(70);
		setUserY(70);
		setFinished();
    }, [pathID, setFinished]);

    useEffect(() => {
        getPath();
    }, [getPath]);

    useEffect(() => {
        console.log("Set New Distance");
        var newDistance;
        setSpotList(spotList => spotList.map((spot) => {
            newDistance = Math.round(Math.sqrt(Math.pow(userX-spot.x, 2) + Math.pow(userY-spot.y, 2)));
            return {...spot, distance: newDistance}; 
        }))
    }, [userX, userY]);

	useEffect(() => {
		if(spotList.length === 0) return;
		console.log("Set Predict Time & PathFinished");
		var newPredictTime = 0;
		for(var i in spotList){
			if(!spotList[i].finished) newPredictTime += spotList[i].distance;
		}
		setPredictTime(newPredictTime);
		if(newPredictTime === 0) {
			setPathFinished(true);
		}
	}, [spotList])

	async function claim(spotID){
		console.log("Claim: " + spotID);
		if(!localStorage.getItem('token')){
			console.log("User Not Logged In, Redirect to Auth");
			alert("Login before claiming");
			navigate('/');
			// window.location.href = '/';
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
		setSpotList(spotList => spotList.map((spot) => {
            if(spot.spotID === spotID) return{...spot, finished: true};
            else return spot; 
        }))
	}

	return (
		<div className="PathPage">
			<div className="path">
				<h1>{pathName}{pathFinished? "✅": ""}</h1>
				<h2 className="predictedTime">預計完成時間: {predictTime}分鐘</h2>
				<h2>路徑地點</h2>
			</div>
			<div className="pathSpots">
				{spotList.map((spot) => {
					return ( 
						<div className="card" key={spot.spotID}>
							<h3>{spot.name}{spot.finished? "✅": ""}</h3>
							{(spot.distance <= 50 && !spot.finished) ? 
							<button onClick={() => {claim(spot.spotID)}}>CLAIM</button> : <p>距離: {spot.distance}m</p>}
							<p>{spot.description}</p>
							<p>x: {spot.x} y: {spot.y}</p>
						</div>
					)
				})}
			</div>
			<div>
                <h3>User X: {userX}, User Y: {userY}</h3>
                <button onClick={() => {setUserX(userX+10)}}>User X+</button>
                <button onClick={() => {setUserX(userX-10)}}>User X-</button>
                <button onClick={() => {setUserY(userY+10)}}>User Y+</button>
                <button onClick={() => {setUserY(userY-10)}}>User Y-</button>
            </div>
		</div>
	)
}

export default PathPage