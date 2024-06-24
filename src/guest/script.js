class GUEST_CONNECTION {
	constructor(before_UUID = !1, restart = !1) {
		this.restart = restart;
		this.before_UUID = before_UUID;
		this.NEXT_STAGE_CONDITION = "wait"
		this.NOW_STAGE_ID = 0
		this.CORRECTED_ANS = !1
		this.STAGES = ["entrance", "laser", "mystery_1", "box", "mystery_2", "trump", "mystery_last", "CLEAR", ]
		this.STAGES_DIV_QUERY = ["#stage_ent", "#stage_A", "#stage_B", "#stage_C", "#stage_D", "#stage_E", "#stage_last", "#stage_clear"]
		this.MYSTERY_STAGES = [2, 4, 6]
		this.MYSTERY_ANSWERS = ["", "", "answer", "", "answer", "", "answer", ""]
		this.start()
	}
	async start() {
		if(this.before_UUID && !this.restart) {
			this.UUID = this.before_UUID
		} else {
			this.UUID = crypto.randomUUID()
		}
		$("#uuid").text(this.UUID);
		if(this.restart) {
			try {
				let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=kick&trg_uuid=${this.before_UUID}`, {
					method: "GET",
					cache: "no-cache",
				})
			} catch(e) {
				$("#connecting_crash").show();
				throw e
			}
		}
		if(this.before_UUID && !this.restart) {
			$("#connecting").show();
			$("#connecting #state_indicator").text("継承中");
			let stage_state;
			try {
				stage_state = await this.get_stage_state()
			} catch(e) {
				$("#connecting_crash").show();
				throw e
			}
			let trg_stage_id = 0;
			for(let room_name in stage_state) {
				if(stage_state[room_name].uuid == this.UUID) {
					trg_stage_id = this.STAGES.indexOf(room_name);
					break
				}
			}
			console.log("move_to", trg_stage_id);
			$("#reload_state").attr("disabled", !1);
			if(trg_stage_id != 0) {
				let result = await this.move_to(trg_stage_id, !1);
				if(result) {
					$("#connecting_crash").show();
					console.log(result);
					return
				}
			} else {
				await alert_org("サーバー上に記録が見つからなかったため、最初から始めます。");
				this.before_UUID = !1;
				this.restart = !1;
				start();
				return
			}
			$("#connecting").hide()
		} else {
			$("#connecting #state_indicator").text("");
			$("#connecting").hide();
			let stage_state;
			try {
				stage_state = await this.get_stage_state()
			} catch(e) {
				$("#connecting_crash").show();
				throw e
			}
			$("#reload_state").attr("disabled", !1);
			if(stage_state.laser.is_used) {
				$("#indicator").removeClass("stage_condition_wait");
				$("#indicator").addClass("stage_condition_full");
				$("#indicator").text("使用中")
			} else {
				$("#indicator").removeClass("stage_condition_wait");
				$("#indicator").addClass("stage_condition_empty");
				$("#indicator").text("空き");
				$("#go_next_stage").attr("disabled", !1)
			}
		}
		$("#go_next_stage").on("click", async() => {
			$("#connecting").show();
			try {
				if(this.NOW_STAGE_ID == 0) {
					$("#connecting #state_indicator").text("参加処理中");
					let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=enter&uuid=${this.UUID}`, {
						method: "GET",
						cache: "no-cache",
					});
					$("#connecting").hide();
					if((await response.text()) != "success") {
						await alert_org("通信エラーが発生しました。もう一度試してください。");
						this.reload();
						return
					}
					Cookies.set('UUID', this.UUID, {
						expires: 0.5
					})
				} else {
					$("#connecting #state_indicator").text("移動処理中");
					let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=move&uuid=${this.UUID}`, {
						method: "GET",
						cache: "no-cache",
					});
					$("#connecting").hide();
					if((await response.text()) != "success") {
						await alert_org("通信エラーが発生しました。もう一度試してください。");
						this.reload();
						return
					}
				}
			} catch(e) {
				console.log(e);
				$("#connecting").hide();
				await alert_org("通信エラーが発生しました。もう一度試してください。");
				this.reload();
				return
			}
			await this.move_to(this.NOW_STAGE_ID + 1)
		});
		$("#answer_field").on("input", () => {
			if($("#answer_field").val()) {
				$("#answer").attr("disabled", !1)
			} else {
				$("#answer").attr("disabled", !0)
			}
		});
		$("#answer").on("click", () => {
			if($("#answer_field").val() == this.MYSTERY_ANSWERS[this.NOW_STAGE_ID]) {
				alert_org("正解！");
				this.CORRECTED_ANS = !0;
				if(this.NOW_STAGE_ID != 6) {
					$("#go_next_stage").attr("disabled", !1)
				} else {
					$("#escape").attr("disabled", !1)
				}
				$("#answer").attr("disabled", !0);
				$("#answer_field").attr("disabled", !0)
			} else {
				alert_org("不正解...")
			}
		});
		$("#reload_state").on("click", this.reload.bind(this));
		$("#reload_trg").on("click", () => {
			$("#reloader").show()
		});
		$("#reloader #allow").on("click", async() => {
			let trg_uuid = `${$("#uuid-enter-1").val()}-${$("#uuid-enter-2").val()}-${$("#uuid-enter-3").val()}-${$("#uuid-enter-4").val()}-${$("#uuid-enter-5").val()}`;
			if(trg_uuid.length == 36) {
				try {
					$("#reloader #allow").attr("disabled", !0);
					$("#reloader #reject").attr("disabled", !0);
					let stage_state = await this.get_stage_state();
					console.log();
					let is_exist = !1;
					for(let room_name in stage_state) {
						if(stage_state[room_name].uuid == trg_uuid) {
							is_exist = !0;
							break
						}
					}
					if(is_exist) {
						alert("UUIDが見つかりました。再接続します。");
						Cookies.set('UUID', trg_uuid, {
							expires: 0.5
						});
						window.location.reload(!1)
					} else {
						alert("そのUUIDは存在しません。")
					}
					$("#reloader #allow").attr("disabled", !1);
					$("#reloader #reject").attr("disabled", !1)
				} catch(e) {
					alert(e.message);
					$("#reloader #allow").attr("disabled", !1);
					$("#reloader #reject").attr("disabled", !1)
				}
			} else {
				alert("文字数が異なります。")
			}
		});
		$("#reloader #reject").on("click", () => {
			$("#reloader").hide()
		})
	}
	async reload() {
		$("#indicator").text("取得中");
		$("#indicator").removeClass("stage_condition_empty");
		$("#indicator").removeClass("stage_condition_full");
		$("#indicator").addClass("stage_condition_wait");
		$("#go_next_stage").attr("disabled", !0);
		$("#reload_state").attr("disabled", !0);
		let stage_state;
		try {
			stage_state = await this.get_stage_state()
		} catch(e) {
			$("#indicator").text("取得失敗");
			alert_org("通信エラーが発生しました。通信環境の良い状態で再取得してください。");
			$("#reload_state").attr("disabled", !1);
			return
		}
		this.indicate_state(stage_state, this.NOW_STAGE_ID);
		$("#reload_state").attr("disabled", !1)
	}
	async get_stage_state() {
		let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=state`, {
			method: "GET",
			cache: "no-cache",
		});
		return await response.json()
	}
	async move_to(trg_stage_id, ignore_error = !0) {
		$(this.STAGES_DIV_QUERY[this.NOW_STAGE_ID]).hide();
		$(this.STAGES_DIV_QUERY[trg_stage_id]).show();
		this.NOW_STAGE_ID = trg_stage_id;
		$("#indicator").text("取得中");
		$("#indicator").removeClass("stage_condition_empty");
		$("#indicator").removeClass("stage_condition_full");
		$("#indicator").addClass("stage_condition_wait");
		$("#go_next_stage").attr("disabled", !0);
		$("#reload_state").attr("disabled", !0);
		if(this.MYSTERY_STAGES.includes(this.NOW_STAGE_ID)) {
			this.CORRECTED_ANS = !1;
			$("#answer_field").val("");
			$("#answer").attr("disabled", !0);
			$("#answer_field").attr("disabled", !1);
			$("#answer_area").show()
		} else {
			$("#answer_area").hide()
		}
		$("#connecting").hide();
		if(this.NOW_STAGE_ID == 6) {
			$("#stage_changer").hide();
			$("#escape_stage").show();
			$("#escape").on("click", async() => {
				$("#connecting").show();
				$("#connecting #state_indicator").text("クリア処理中");
				try {
					let response = await fetch(`https://script.google.com/macros/s/AKfycbwMbUDB-Gdqrm9grC9nx9evBZG59NTOiT58YueT1LVB_BEOwaBun6DvarLmwlKPtoec/exec?type=move&uuid=${this.UUID}`, {
						method: "GET",
						cache: "no-cache",
					});
					$("#connecting").hide();
					if((await response.text()) != "success") {
						if(ignore_error) {
							alert_org("通信エラーが発生しました。もう一度試してください。");
							return
						} else {
							return "exception"
						}
					}
				} catch(e) {
					$("#connecting").hide();
					if(ignore_error) {
						alert_org("通信エラーが発生しました。もう一度試してください。");
						return
					} else {
						return e
					}
				}
				$("#answer_area").hide();
				$("#escape_stage").hide();
				$("#stage_last").hide();
				$("#stage_clear").show();
				Cookies.remove('UUID')
			})
		} else {
			let stage_state;
			try {
				stage_state = await this.get_stage_state()
			} catch(e) {
				$("#indicator").text("取得失敗");
				alert_org("通信エラーが発生しました。通信環境の良い状態で再取得してください。");
				$("#reload_state").attr("disabled", !1);
				return
			}
			$("#reload_state").attr("disabled", !1);
			this.indicate_state(stage_state, this.NOW_STAGE_ID)
		}
	}
	indicate_state(stage_state, now_stage_id) {
		if(stage_state[this.STAGES[now_stage_id + 1]].uuid == this.UUID) {
			alert_org("サーバー上で次のステージに進めていたので、ページを進めました。");
			this.move_to(this.NOW_STAGE_ID + 1)
		} else {
			if(stage_state[this.STAGES[now_stage_id + 1]].is_used) {
				$("#indicator").removeClass("stage_condition_wait");
				$("#indicator").addClass("stage_condition_full");
				$("#indicator").text("使用中");
				$("#go_next_stage").attr("disabled", !0)
			} else {
				$("#indicator").removeClass("stage_condition_wait");
				$("#indicator").addClass("stage_condition_empty");
				$("#indicator").text("空き");
				if(this.MYSTERY_STAGES.includes(now_stage_id) && !this.CORRECTED_ANS) {
					$("#go_next_stage").attr("disabled", !0)
				} else {
					$("#go_next_stage").attr("disabled", !1)
				}
			}
		}
	}
}
window.onload = () => {
	if(navigator.cookieEnabled) {
		if(Cookies.get("UUID")) {
			const conf = async() => {
				if(await confirm_org("前回の接続情報が残っています。継承しますか？")) {
					window.CONNECTING_INSTANCE = new GUEST_CONNECTION(Cookies.get("UUID"))
				} else {
					if(await confirm_org("本当に最初から始めますか？")) {
						window.CONNECTING_INSTANCE = new GUEST_CONNECTION(Cookies.get("UUID"), !0);
						Cookies.remove('UUID')
					} else {
						conf()
					}
				}
			};
			conf()
		} else {
			window.CONNECTING_INSTANCE = new GUEST_CONNECTION()
		}
	} else {
		$("#unable_cookie").show()
	}
};

function confirm_org(message) {
	$("#confirm").show();
	$("#confirm span").text(message);
	return new Promise((resolve, reject) => {
		$("#confirm #allow").on("click", () => {
			$("#confirm #allow").off("click");
			$("#confirm #reject").off("click");
			$("#confirm span").text("");
			$("#confirm").hide();
			resolve(!0)
		});
		$("#confirm #reject").on("click", () => {
			$("#confirm #allow").off("click");
			$("#confirm #reject").off("click");
			$("#confirm span").text("");
			$("#confirm").hide();
			resolve(!1)
		})
	})
}

function alert_org(message) {
	$("#alert").show();
	$("#alert span").text(message);
	return new Promise((resolve, reject) => {
		$("#alert #allow").one("click", () => {
			$("#alert span").text("");
			$("#alert").hide();
			resolve(!0)
		})
	})
}
