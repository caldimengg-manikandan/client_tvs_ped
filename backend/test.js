async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/mh-development-tracker');
        const data = await res.json();
        const tracker = data.data[0];
        console.log("Got tracker:", tracker._id);

        console.log("Testing update...");
        try {
            const putRes = await fetch(`http://localhost:5000/api/mh-development-tracker/${tracker._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    remarks: "Test remark",
                    implementationVisibility: "Medium"
                })
            });
            console.log("Update Status:", putRes.status);
            console.log(await putRes.text());
        } catch (e) {
            console.error("Update error:", e.message);
        }

        console.log("Testing delete...");
        try {
            const delRes = await fetch(`http://localhost:5000/api/mh-development-tracker/${tracker._id}`, {
                method: 'DELETE'
            });
            console.log("Delete Status:", delRes.status);
            console.log(await delRes.text());
        } catch (e) {
            console.error("Delete error:", e.message);
        }
    } catch (e) {
        console.error(e.message);
    }
}
test();
