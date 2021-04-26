<script>

    let text = "이거 맞냐?";
    let lbtx = "";

    function setOtherTextField(){
        lbtx = text;
    }

</script>

<page>
    <gridLayout columns="*,120" rows="70,*">
		<!-- Configures the text field and ensures that pressing Return on the keyboard
				produces the same result as tapping the button. -->
		<textField col="0" row="0" bind:text="{text}" hint="Type new task..." editable="true" on:returnPress="{setOtherTextField}"/>
		<button col="1" row="0" text="Add task" on:tap="{setOtherTextField}" />
        <textField col="0" row="1" bind:text="{lbtx}" hint="setOthertextField new task..." editable="false"/>
    </gridLayout>
</page>

<style>
</style>